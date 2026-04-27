# POST /api/v1/ask

## 챗봇 질문

유저의 질문을 받아 RAG(Retrieval-Augmented Generation) 방식으로 답변을 생성합니다.  
Qdrant 벡터 DB에서 관련 지식을 검색한 뒤 Gemini 모델로 답변을 생성하며, 참고한 출처 메타데이터를 함께 반환합니다.

---

## Request

**Method**: `POST`  
**Path**: `/api/v1/ask`  
**Content-Type**: `application/json`

### Request Body

| 필드     | 타입   | 필수 | 설명               |
| -------- | ------ | ---- | ------------------ |
| question | String | O    | 유저가 입력한 질문 |

```json
{
  "question": "수강신청은 언제부터인가요?"
}
```

---

## Response

**Status**: `200 OK`

### Response Body

```json
{
  "success": true,
  "message": null,
  "data": {
    "answer": "2026학년도 1학기 수강신청은 2월 중순에 진행됩니다. 장바구니 신청 기간을 놓치지 마세요.",
    "sources": [
      {
        "knowledge_id": "550e8400-e29b-41d4-a716-446655440000",
        "category": "academic",
        "source": "교무처 공지사항",
        "created_by": "0xAbCdEf1234567890abcdef1234567890AbCdEf12"
      },
      {
        "knowledge_id": "661f9511-f3ac-52e5-b827-557766551111",
        "category": "scholarship",
        "source": "학생처 공지사항",
        "created_by": "admin"
      }
    ]
  },
  "error": null
}
```

### Response Fields

| 필드                      | 타입          | 설명                                    |
| ------------------------- | ------------- | --------------------------------------- |
| answer                    | String        | Gemini가 생성한 답변 텍스트             |
| sources                   | Array         | 답변 생성에 참고한 출처 목록 (최대 3개) |
| sources[].knowledge_id    | String (UUID) | 참고한 지식 항목의 Qdrant 포인트 ID     |
| sources[].category        | String        | 참고한 지식 항목의 카테고리             |
| sources[].source          | String        | 정보 출처 (공지사항, 부서명 등)         |
| sources[].created_by      | String        | 정보를 기여한 유저의 지갑 주소          |

---

## Error

| 에러 코드             | HTTP Status | 조건                                   |
| --------------------- | ----------- | -------------------------------------- |
| INTERNAL_SERVER_ERROR | 500         | Gemini API 호출 실패 또는 벡터 DB 오류 |

---

## 비즈니스 규칙

1. 질문을 768차원 벡터로 임베딩 (Gemini Embedding API)
2. Qdrant에서 코사인 유사도 기준 상위 3개 지식 항목 검색
3. 검색된 내용을 컨텍스트로 삼아 Gemini 모델로 답변 생성
4. 관련 정보가 없으면 "죄송합니다. 관련된 정보를 찾을 수 없습니다" 반환
5. 답변과 함께 참고한 출처의 메타데이터(knowledge_id, category, source, created_by)를 반환
