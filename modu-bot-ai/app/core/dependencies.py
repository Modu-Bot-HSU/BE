from functools import lru_cache
from app.db.vectorDB import VectorDB


@lru_cache
def get_vector_db() -> VectorDB:
    return VectorDB()
