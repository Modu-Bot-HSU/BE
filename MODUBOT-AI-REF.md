# MODUBOT-AI 수정 계획 및 코드 스니펫

## 수정 대상 파일
- `modu-bot-ai/app/api/v1/chat/rag_service.py`

---

## A. RAG 답변에 출처(Metadata) 포함

### 변경 대상
`RAGService.generate_answer`

### 변경 내용
- 기존: `str` 반환 (`response.text`)
- 변경: `dict` 반환 — `answer` (텍스트) + `sources` (참조 문서 메타데이터 리스트)
- `search_results`의 각 `payload`에서 `id`, `title`, `category`, `source` 추출

### 주의
- `rag_controller.py`의 `/ask` 엔드포인트는 `data=answer`로 그대로 사용 가능 (`ResponseType.data`는 Any 타입)
- 컨트롤러 수정 불필요

### 코드

```python
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
            "id": res.id,
            "title": res.payload.get("title", ""),
            "category": res.payload.get("category", ""),
            "source": res.payload.get("source", ""),
        }
        for res in search_results
    ]

    return {"answer": response.text, "sources": sources}
```

---

## B. 벡터 업데이트 로직 최적화

### 변경 대상
`RAGService.update_info_logic`

### 변경 내용
- 기존: `{**existing_payload, ...refined_data}` 방식으로 병합 (기존 필드가 무엇인지 불명확)
- 변경: 보존할 필드(`created_at`, `created_by`, `approved_by`)를 명시적으로 지정하여 새 payload를 구성
- 임베딩 텍스트를 `refined_data`의 `title + content`로 명확히 한정

### 코드

```python
async def update_info_logic(
    self,
    info_id: str,
    wallet_address: str,
    category: str,
    source: str,
    content: str,
):
    existing_points = self.vector_db.client.retrieve(
        collection_name=self.vector_db.collection_name, ids=[info_id]
    )

    if not existing_points:
        return None, "해당 정보를 찾을 수 없습니다."

    existing_payload = existing_points[0].payload

    refined_data = await self.refine_raw_text(
        category=category, source=source, content=content
    )

    embed_text = f"{refined_data['title']}\n{refined_data['content']}"
    new_vector = self.get_embedding(embed_text)

    now = datetime.now().isoformat()
    updated_payload = {
        # 보존: 생성 시점 정보
        "created_at": existing_payload.get("created_at"),
        "created_by": existing_payload.get("created_by"),
        "approved_by": existing_payload.get("approved_by", "admin"),
        # 갱신: 정제된 데이터
        "category": refined_data["category"],
        "title": refined_data["title"],
        "content": refined_data["content"],
        "source": refined_data["source"],
        "updated_at": now,
        "updated_by": wallet_address,
    }

    from app.schemas.vector import VectorPoint

    point = VectorPoint(id=info_id, vector=new_vector, payload=updated_payload)
    self.vector_db.upsert_data(point)

    return updated_payload, None
```

---

## C. 신규 기능: 대기 데이터 AI 요약

### 추가 대상
`RAGService.summarize_pending_info(self, raw_content: str)`

### 요구사항
- `self.refine_model` 사용
- 사용자의 원본 텍스트에서 핵심 내용만 추출해 요약 문자열 반환
- JSON 구조화 없이 순수 텍스트 요약

### 코드

```python
async def summarize_pending_info(self, raw_content: str) -> str:
    prompt = f"""
    다음은 사용자가 제출한 대학 관련 원본 정보입니다.
    핵심 내용만 간결하게 요약해주세요. 불필요한 반복, 인사말, 불명확한 내용은 제거하세요.
    반드시 한국어로 작성하세요.

    [원본 내용]
    {raw_content}

    [요약]:
    """

    response = self.client.models.generate_content(
        model=self.refine_model, contents=prompt
    )

    return response.text.strip()
```

---

## D. 신규 기능: 벡터 데이터 삭제

### 추가 대상
`RAGService.delete_vector_info(self, info_id: str)`

### 요구사항
- `info_id`에 해당하는 벡터 포인트를 Qdrant에서 완전 삭제
- 존재하지 않는 ID면 `False` 반환, 성공 시 `True` 반환

### 코드

```python
def delete_vector_info(self, info_id: str) -> bool:
    existing_points = self.vector_db.client.retrieve(
        collection_name=self.vector_db.collection_name, ids=[info_id]
    )

    if not existing_points:
        return False

    from qdrant_client.http import models as qdrant_models

    self.vector_db.client.delete(
        collection_name=self.vector_db.collection_name,
        points_selector=qdrant_models.PointIdsList(points=[info_id]),
    )

    return True
```

---

## 최종 적용 순서

1. `generate_answer` 수정 (A)
2. `update_info_logic` 수정 (B)
3. `summarize_pending_info` 추가 (C)
4. `delete_vector_info` 추가 (D)
