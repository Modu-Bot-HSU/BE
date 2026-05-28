# POST /chat/ask

## AI 챗봇 질문

사용자가 입력한 질문을 AI 서버(FastAPI + Qdrant RAG)로 전달하고 답변을 반환합니다.  
인증 없이 누구나 사용할 수 있습니다.

---

## Request

**Method**: `POST`  
**Path**: `/chat/ask`  
**Content-Type**: `application/json`

### Request Body

| 필드     | 타입   | 필수 | 설명              |
| -------- | ------ | ---- | ----------------- |
| question | String | O    | AI에게 보낼 질문  |

```json
{
  "question": "수강신청은 언제부터인가요?"
}
```

---

## Response

**Status**: `201 Created`

### Response Body

```json
{
  "message": "답변 생성 완료",
  "answer": "수강신청은 7월 14일부터 시작되며, 학년별로 날짜가 다릅니다."
}
```

### Response Fields

| 필드    | 타입   | 설명                     |
| ------- | ------ | ------------------------ |
| message | String | 처리 결과 메시지         |
| answer  | String | AI가 생성한 답변 텍스트  |

---

## Error

| 에러 코드             | HTTP Status | 조건                        |
| --------------------- | ----------- | --------------------------- |
| BAD_REQUEST           | 400         | `question` 필드 누락        |
| INTERNAL_SERVER_ERROR | 500         | AI 서버 통신 실패           |

---

## 비즈니스 규칙

1. 인증 불필요 — 누구나 사용 가능
2. 실제 답변은 `modu-bot-ai` FastAPI 서버의 RAG 파이프라인에서 생성
3. AI 서버가 응답하지 않으면 500 에러 반환
