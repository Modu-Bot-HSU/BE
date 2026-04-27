from fastapi import APIRouter, Query, Depends
from typing import Optional
from app.schemas.common import ResponseType
from app.api.v1.chat.rag_service import RAGService
from app.core.dependencies import get_rag_service
from pydantic import BaseModel, Field

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


class KnowledgeInsertRequest(BaseModel):
    knowledge_id: str
    wallet_address: str = Field(..., description="유저의 지갑 주소")
    category: str
    content: str
    source: Optional[str] = Field(None, description="정보의 출처 (선택 사항)")
    original_question: Optional[str] = None


class KnowledgeUpdateRequest(BaseModel):
    wallet_address: str = Field(..., description="유저의 지갑 주소")
    category: str
    content: str
    original_question: Optional[str] = None


@router.post("/ask", response_model=ResponseType)
async def ask_question(
    request: ChatRequest, rag_service: RAGService = Depends(get_rag_service)
):
    result = rag_service.generate_answer(request.question)
    return ResponseType(success=True, data=result)


@router.get("/knowledge", response_model=ResponseType)
async def get_knowledge_by_category(
    category: str = Query(..., description="조회할 카테고리"),
    limit: int = Query(50, description="한 페이지당 가져올 개수"),
    offset: Optional[str] = Query(
        None, description="마지막으로 읽은 데이터의 ID(커서)"
    ),
    rag_service: RAGService = Depends(get_rag_service),
):
    result = await rag_service.get_knowledge_by_category_logic(
        category=category, limit=limit, offset=offset
    )
    return ResponseType(success=True, data=result)


@router.post("/knowledge", response_model=ResponseType)
async def insert_knowledge(
    request: KnowledgeInsertRequest,
    rag_service: RAGService = Depends(get_rag_service),
):
    await rag_service.insert_or_update_knowledge_logic(
        knowledge_id=request.knowledge_id,
        wallet_address=request.wallet_address,
        category=request.category,
        content=request.content,
        original_question=request.original_question,
    )
    return ResponseType(
        success=True,
        message="지식 베이스 등록 완료",
        data={"id": request.knowledge_id},
    )


@router.delete("/knowledge/{knowledge_id}", response_model=ResponseType)
async def delete_knowledge(
    knowledge_id: str,
    rag_service: RAGService = Depends(get_rag_service),
):
    await rag_service.delete_knowledge_logic(knowledge_id=knowledge_id)
    return ResponseType(success=True, message="삭제 완료", data={"id": knowledge_id})


@router.put("/update_knowledge/{knowledge_id}", response_model=ResponseType)
async def update_category_knowledge(
    knowledge_id: str,
    request: KnowledgeUpdateRequest,
    rag_service: RAGService = Depends(get_rag_service),
):
    _, error_msg = await rag_service.update_knowledge_logic(
        knowledge_id=knowledge_id,
        wallet_address=request.wallet_address,
        category=request.category,
        content=request.content,
        original_question=request.original_question,
    )
    if error_msg:
        return ResponseType(
            success=False, error={"code": "NOT_FOUND", "message": error_msg}
        )
    return ResponseType(
        success=True, message="정보 수정 완료", data={"id": knowledge_id}
    )
