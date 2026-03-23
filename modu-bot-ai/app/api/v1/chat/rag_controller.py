from fastapi import APIRouter
from app.schemas.common import ResponseType
from app.api.v1.chat.rag_service import rag_service
from pydantic import BaseModel

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


@router.post("/ask", response_model=ResponseType)
async def ask_question(request: ChatRequest):

    answer = rag_service.generate_answer(request.question)

    return ResponseType(success=True, data={"answer": answer})
