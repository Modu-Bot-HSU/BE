from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# LLM이 내뱉을 결과 구조 정의
class RefinedKnowledge(BaseModel):
    title: str
    content: str
    category: str
    source: str


class KnowledgeDataType(BaseModel):
    category: str
    title: str
    content: str
    source: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str
    approved_by: Optional[str] = "admin"

    class Config:
        from_attributes = True
