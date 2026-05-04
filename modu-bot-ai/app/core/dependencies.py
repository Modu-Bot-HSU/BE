from functools import lru_cache
from app.db.vectorDB import VectorDB
from app.api.v1.chat.rag_service import RAGService


@lru_cache
def get_vector_db() -> VectorDB:
    return VectorDB()


@lru_cache
def get_rag_service() -> RAGService:
    vdb = get_vector_db()
    return RAGService(vector_db=vdb)
