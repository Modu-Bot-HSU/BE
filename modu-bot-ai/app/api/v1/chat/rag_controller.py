from fastapi import APIRouter
from app.schemas.common import ResponseType, ErrorType
from app.api.v1.chat.rag_service import rag_service
from pydantic import BaseModel

router = APIRouter()


class QuestionRequest(BaseModel):
    question: str


@router.post("/ask", response_model=ResponseType)
async def ask_question(request: QuestionRequest):
    answer = "answer"
    return ResponseType(success=True, data={"answer": answer})
