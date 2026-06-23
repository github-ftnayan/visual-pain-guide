import json
import os
import re
from typing import List, Dict, Any

import chromadb
from sentence_transformers import SentenceTransformer

_BASE_DIR = os.path.dirname(__file__)
_CHROMA_PATH = os.path.join(_BASE_DIR, "data", "chroma_db")
_BM25_CORPUS_PATH = os.path.join(_BASE_DIR, "data", "bm25_corpus.json")

COLLECTION_NAME = "pt_knowledge"
EMBED_MODEL_NAME = "BAAI/bge-base-en-v1.5"

MUSCLE_KEYWORDS = [
    "lumbar", "lower back", "trapezius", "upper back", "hamstring", "quadriceps",
    "glute", "gluteal", "cervical", "neck", "calf", "gastrocnemius", "soleus",
    "shoulder", "rotator cuff", "hip flexor", "iliopsoas", "psoas",
    "iliotibial", "IT band", "ITB",
]


def _get_embed_model() -> SentenceTransformer:
    return SentenceTransformer(EMBED_MODEL_NAME)


def _get_chroma_client() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(path=_CHROMA_PATH)


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 80) -> List[Dict[str, Any]]:
    """Split text into overlapping chunks at paragraph boundaries."""
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]

    chunks = []
    current_words: List[str] = []
    chunk_index = 0

    for para in paragraphs:
        para_words = para.split()

        # If adding this paragraph would exceed chunk_size, flush current chunk first
        if current_words and len(current_words) + len(para_words) > chunk_size:
            chunk_text_str = " ".join(current_words)
            muscle_hint = _detect_muscle_group(chunk_text_str)
            chunks.append({
                "text": chunk_text_str,
                "metadata": {
                    "chunk_index": chunk_index,
                    "muscle_group_hint": muscle_hint,
                },
            })
            chunk_index += 1
            # Keep overlap words from end of current chunk
            current_words = current_words[-overlap:] if len(current_words) > overlap else []

        current_words.extend(para_words)

        # Flush oversized single paragraph into multiple chunks
        while len(current_words) > chunk_size:
            chunk_text_str = " ".join(current_words[:chunk_size])
            muscle_hint = _detect_muscle_group(chunk_text_str)
            chunks.append({
                "text": chunk_text_str,
                "metadata": {
                    "chunk_index": chunk_index,
                    "muscle_group_hint": muscle_hint,
                },
            })
            chunk_index += 1
            current_words = current_words[chunk_size - overlap:]

    if current_words:
        chunk_text_str = " ".join(current_words)
        muscle_hint = _detect_muscle_group(chunk_text_str)
        chunks.append({
            "text": chunk_text_str,
            "metadata": {
                "chunk_index": chunk_index,
                "muscle_group_hint": muscle_hint,
            },
        })

    return chunks


def _detect_muscle_group(text: str) -> str:
    text_lower = text.lower()
    for kw in MUSCLE_KEYWORDS:
        if kw.lower() in text_lower:
            return kw
    return "general"


def embed_and_store(file_path: str) -> int:
    """
    Load a PT knowledge text file, chunk it, embed with BGE, and store in ChromaDB.
    Also persists the raw corpus to bm25_corpus.json for BM25 retrieval.
    Returns number of chunks stored.
    """
    abs_path = os.path.join(_BASE_DIR, file_path)
    if not os.path.exists(abs_path):
        raise FileNotFoundError(f"PT knowledge file not found: {abs_path}")

    with open(abs_path, encoding="utf-8") as f:
        raw_text = f.read()

    source_name = os.path.basename(file_path)
    chunks = chunk_text(raw_text)

    model = _get_embed_model()
    # BGE: no prefix needed for passage embeddings (only queries need the prefix)
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False).tolist()

    client = _get_chroma_client()

    # Delete and recreate collection to make embed_and_store idempotent
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    ids = [f"{source_name}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{**c["metadata"], "source": source_name} for c in chunks]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )

    # Persist corpus for BM25
    corpus = [{"id": ids[i], "text": texts[i]} for i in range(len(texts))]
    with open(_BM25_CORPUS_PATH, "w", encoding="utf-8") as f:
        json.dump(corpus, f, ensure_ascii=False, indent=2)

    return len(chunks)
