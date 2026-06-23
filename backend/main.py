import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import EmbedRequest, EmbedResponse, TriageRequest, TriageResponse
from triage import run_triage
from matcher import match_videos

app = FastAPI(title="Visual Pain Guide API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.post("/api/v1/triage", response_model=TriageResponse)
async def triage_endpoint(request: TriageRequest):
    if len(request.symptom_text.strip()) < 10:
        raise HTTPException(status_code=422, detail="Symptom description is too short.")

    analysis = run_triage(request.muscle_id, request.symptom_text)

    videos = []
    if analysis.safety_status == "SAFE":
        videos = match_videos(request.muscle_id, analysis.remediation_tags)

    return TriageResponse(analysis=analysis, videos=videos)


@app.post("/api/v1/admin/embed", response_model=EmbedResponse)
async def embed_endpoint(request: EmbedRequest):
    """
    Ingest a PT knowledge text file into the ChromaDB vector store and BM25 corpus.
    Run once after deployment to seed the RAG knowledge base.
    Idempotent — re-running replaces existing embeddings.
    """
    try:
        from embedder import embed_and_store
        chunks_stored = embed_and_store(request.file_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

    # Reload BM25 index on next request after re-embedding
    try:
        import retriever
        retriever._bm25_index = None
        retriever._bm25_corpus = []
    except Exception:
        pass

    return EmbedResponse(
        status="ok",
        chunks_stored=chunks_stored,
        collection="pt_knowledge",
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
