from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InfoDataType(BaseModel):
    id: int
    category: str
    title: str
    content: str
    source: str
    created_at: datetime
    updated_at: datetime
    approved_by: Optional[str] = "admin"

    class Config:
        from_attributes = True
