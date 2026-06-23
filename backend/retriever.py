import json
import os
from typing import List, Dict, Tuple

import chromadb
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi

from embedder import (
    COLLECTION_NAME,
    EMBED_MODEL_NAME,
    _CHROMA_PATH,
    _BM25_CORPUS_PATH,
)

_embed_model: SentenceTransformer | None = None
_reranker: CrossEncoder | None = None
_bm25_index: BM25Okapi | None = None
_bm25_corpus: List[str] = []
_chroma_client: chromadb.PersistentClient | None = None


def _get_embed_model() -> SentenceTransformer:
    global _embed_model
    if _embed_model is None:
        _embed_model = SentenceTransformer(EMBED_MODEL_NAME)
    return _embed_model


def _get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _reranker


def _get_chroma_collection() -> chromadb.Collection | None:
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=_CHROMA_PATH)
    try:
        return _chroma_client.get_collection(COLLECTION_NAME)
    except Exception:
        return None


def _load_bm25() -> Tuple[BM25Okapi | None, List[str]]:
    global _bm25_index, _bm25_corpus
    if _bm25_index is not None:
        return _bm25_index, _bm25_corpus

    if not os.path.exists(_BM25_CORPUS_PATH):
        return None, []

    with open(_BM25_CORPUS_PATH, encoding="utf-8") as f:
        corpus_data = json.load(f)

    _bm25_corpus = [entry["text"] for entry in corpus_data]
    tokenized = [doc.lower().split() for doc in _bm25_corpus]
    _bm25_index = BM25Okapi(tokenized)
    return _bm25_index, _bm25_corpus


def _reciprocal_rank_fusion(
    dense_docs: List[str],
    sparse_docs: List[str],
    k: int = 60,
) -> List[str]:
    """Merge two ranked lists using Reciprocal Rank Fusion."""
    scores: Dict[str, float] = {}

    for rank, doc in enumerate(dense_docs):
        scores[doc] = scores.get(doc, 0.0) + 1.0 / (k + rank + 1)

    for rank, doc in enumerate(sparse_docs):
        scores[doc] = scores.get(doc, 0.0) + 1.0 / (k + rank + 1)

    return sorted(scores, key=lambda d: scores[d], reverse=True)


def retrieve_context(muscle_id: str, symptom_text: str, n_results: int = 3) -> str:
    """
    Hybrid retrieval pipeline: dense (BGE) + sparse (BM25) → RRF → cross-encoder reranking.
    Returns the top-n relevant PT knowledge passages as a formatted string.
    Returns empty string if the knowledge base has not been seeded yet.
    """
    query = f"Physiotherapy assessment and treatment for {muscle_id.replace('_', ' ')}: {symptom_text}"
    # BGE requires this prefix for query embeddings (not passage embeddings)
    bge_query = f"Represent this sentence: {query}"

    # --- Step 1: Dense retrieval ---
    collection = _get_chroma_collection()
    dense_hits: List[str] = []
    if collection is not None:
        model = _get_embed_model()
        query_embedding = model.encode([bge_query], normalize_embeddings=True).tolist()[0]
        dense_top_k = min(20, collection.count())
        if dense_top_k > 0:
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=dense_top_k,
                include=["documents"],
            )
            dense_hits = results["documents"][0] if results["documents"] else []

    # --- Step 2: Sparse BM25 retrieval ---
    bm25, corpus = _load_bm25()
    sparse_hits: List[str] = []
    if bm25 is not None and corpus:
        tokenized_query = query.lower().split()
        scores = bm25.get_scores(tokenized_query)
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:20]
        sparse_hits = [corpus[i] for i in top_indices if scores[i] > 0]

    # --- Graceful degradation: no knowledge base ---
    if not dense_hits and not sparse_hits:
        return ""

    # --- Step 3: Reciprocal Rank Fusion ---
    merged = _reciprocal_rank_fusion(dense_hits, sparse_hits)[:10]

    if not merged:
        return ""

    # --- Step 4: Cross-encoder reranking ---
    reranker = _get_reranker()
    pairs = [(query, doc) for doc in merged]
    scores_list = reranker.predict(pairs).tolist()
    reranked = [doc for _, doc in sorted(zip(scores_list, merged), key=lambda x: x[0], reverse=True)]

    top_passages = reranked[:n_results]
    return "\n\n---\n\n".join(top_passages)
