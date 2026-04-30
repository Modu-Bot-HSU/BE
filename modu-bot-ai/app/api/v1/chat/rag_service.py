from google import genai
from app.constants.config import settings
from app.constants.prompt import RAG_ANSWER_PROMPT_TEMPLATE
from app.schemas.knowledge_data import RefinedKnowledge
from app.schemas.vector import VectorPoint
from datetime import datetime
import json


class RAGService:
    def __init__(self, vector_db):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.answer_model = settings.GEMINI_ANSWER_MODEL
        self.refine_model = settings.GEMINI_REFINE_MODEL
        self.embedding_model = settings.GEMINI_EMBEDDING_MODEL
        self.vector_db = vector_db

    def get_embedding(self, text_or_list: str | list[str]):
        input_data = [text_or_list] if isinstance(text_or_list, str) else text_or_list
        result = self.client.models.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            contents=input_data,
            config={"output_dimensionality": 768},
        )
        embeddings = [embedding.values for embedding in result.embeddings]
        return embeddings[0] if isinstance(text_or_list, str) else embeddings

    def generate_answer(self, question: str) -> dict:
        query_vector = self.get_embedding(question)
        search_results = self.vector_db.search_similar(query_vector, limit=3)
        context_text = "\n".join(
            [res.payload.get("content", "") for res in search_results]
        )
        prompt = RAG_ANSWER_PROMPT_TEMPLATE.format(
            context=context_text, question=question
        )
        response = self.client.models.generate_content(
            model=self.answer_model, contents=prompt
        )
        sources = [
            {
                "knowledge_id": str(res.id),
                "category": res.payload.get("category"),
                "source": res.payload.get("source"),
                "created_by": res.payload.get("created_by"),
            }
            for res in search_results
        ]
        return {"answer": response.text, "sources": sources}

    async def refine_raw_text(
        self, category: str, content: str, original_question: str = None
    ) -> dict:
        question_context = (
            f"- 시스템 질문: {original_question}" if original_question else ""
        )
        prompt = f"""
사용자가 입력한 대학 관련 정보를 바탕으로 RAG 시스템에 저장할 정제된 데이터를 생성해줘.

[입력 데이터]
- 카테고리: {category}
{question_context}
- 내용: {content}

[지침]
1. 내용(content)을 바탕으로 공지사항 형식의 명확한 제목(title)을 작성할 것.
2. 시스템 질문이 있는 경우, 질문과 답변을 결합하여 독립적으로 이해 가능한 완결성 있는 문장으로 작성할 것.
3. 내용(content)의 맞춤법을 교정하고, '~함', '~임' 등의 말투를 '~합니다' 또는 문어체로 바꿀 것.
4. 카테고리는 입력받은 값을 기본으로 하되, 내용과 어울리지 않으면 적절히 수정할 것.
5. 반드시 한국어로 작성할 것.
"""
        response = self.client.models.generate_content(
            model=self.refine_model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": RefinedKnowledge,
            },
        )
        return json.loads(response.text)

    async def insert_or_update_knowledge_logic(
        self,
        knowledge_id: str,
        wallet_address: str,
        category: str,
        content: str,
        original_question: str = None,
    ) -> dict:
        refined_data = await self.refine_raw_text(
            category=category,
            content=content,
            original_question=original_question,
        )
        now = datetime.now().isoformat()
        existing_points = self.vector_db.client.retrieve(
            collection_name=self.vector_db.collection_name, ids=[knowledge_id]
        )
        if existing_points:
            payload = {
                **existing_points[0].payload,
                "category": refined_data["category"],
                "title": refined_data["title"],
                "content": refined_data["content"],
                "source": refined_data.get("source", ""),
                "updated_at": now,
                "updated_by": wallet_address,
            }
        else:
            payload = {
                "id": knowledge_id,
                "category": refined_data["category"],
                "title": refined_data["title"],
                "content": refined_data["content"],
                "source": refined_data.get("source", ""),
                "created_at": now,
                "updated_at": now,
                "created_by": wallet_address,
                "updated_by": wallet_address,
                "approved_by": "admin",
            }
        vector = self.get_embedding(
            f"{refined_data['title']}\n{refined_data['content']}"
        )
        point = VectorPoint(id=knowledge_id, vector=vector, payload=payload)
        self.vector_db.upsert_data(point)
        return payload

    async def get_knowledge_by_category_logic(
        self, category: str | None = None, limit: int = 50, offset: str | int | None = None
    ) -> list:
        result = self.vector_db.get_knowledges_scroll(
            category=category, limit=limit, offset=offset
        )
        return result

    async def delete_knowledge_logic(self, knowledge_id: str):
        self.vector_db.delete_point(knowledge_id)

    async def update_knowledge_logic(
        self,
        knowledge_id: str,
        wallet_address: str,
        category: str,
        content: str,
        original_question: str = None,
    ):
        existing_points = self.vector_db.client.retrieve(
            collection_name=self.vector_db.collection_name, ids=[knowledge_id]
        )
        if not existing_points:
            return None, "해당 정보를 찾을 수 없습니다."
        existing_payload = existing_points[0].payload
        refined_data = await self.refine_raw_text(
            category=category, content=content, original_question=original_question
        )
        new_vector = self.get_embedding(
            f"{refined_data['title']}\n{refined_data['content']}"
        )
        now = datetime.now().isoformat()
        updated_payload = {
            **existing_payload,
            "category": refined_data["category"],
            "title": refined_data["title"],
            "content": refined_data["content"],
            "source": refined_data.get("source", ""),
            "updated_at": now,
            "updated_by": wallet_address,
        }
        point = VectorPoint(id=knowledge_id, vector=new_vector, payload=updated_payload)
        self.vector_db.upsert_data(point)
        return updated_payload, None
