from pydantic import BaseModel
from typing import List, Any
from app.schemas.info_data import InfoDataType


class VectorPoint(BaseModel):
    id: str
    vector: List[float]
    payload: InfoDataType
