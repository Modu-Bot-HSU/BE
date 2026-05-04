from pydantic import BaseModel
from typing import List
from app.schemas.knowledge_data import KnowledgeDataType


class VectorPoint(BaseModel):
    id: str
    vector: List[float]
    payload: KnowledgeDataType
