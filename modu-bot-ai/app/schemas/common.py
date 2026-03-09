from pydantic import BaseModel
from typing import TypeVar, Generic, Optional

T = TypeVar("T")


class ErrorType(BaseModel):
    code: str
    message: str


class ResponseType(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorType] = None
