# POST /api/v1/knowledge

## 지식 베이스 등록

관리자가 유저의 정보 기여를 승인하면, NestJS 서버가 이 엔드포인트를 호출합니다.  
유저의 원본 답변을 AI로 정제한 뒤 벡터 임베딩하여 Qdrant 지식 베이스에 저장(upsert)합니다.  
동일한 `knowledge_id`가 이미 존재하면 업데이트, 없으면 신규 생성합니다.

---

## Request

**Method**: `POST`  
**Path**: `/api/v1/knowledge`  
**Content-Type**: `application/json`

### Request Body

| 필드              | 타입          | 필수 | 설명                                                |
| ----------------- | ------------- | ---- | --------------------------------------------------- |
| knowledge_id      | String (UUID) | O    | NestJS 대기 DB의 항목 ID. Qdrant 포인트 ID로 사용   |
| wallet_address    | String        | O    | 정보를 기여한 유저의 지갑 주소                      |
| category          | String        | O    | 카테고리 키                                         |
| content           | String        | O    | 유저가 입력한 원본 답변 (정제 전)                   |
| original_question | String        | X    | 유저에게 제시된 시스템 질문. 제공 시 정제 품질 향상 |

```json
{
  "knowledge_id": "550e8400-e29b-41d4-a716-446655440000",
  "wallet_address": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
  "category": "academic",
  "content": "수강신청 7월 14일부터임 학년별로 다름",
  "original_question": "다음 학기 수강신청은 언제부터인가요?"
}
```

---

## Response

**Status**: `200 OK`

### Response Body

```json
{
  "success": true,
  "message": "지식 베이스 등록 완료",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "error": null
}
```

### Response Fields

| 필드    | 타입          | 설명                  |
| ------- | ------------- | --------------------- |
| message | String        | 처리 결과 메시지      |
| data.id | String (UUID) | 등록된 지식 항목의 ID |

---

## Error

| 에러 코드             | HTTP Status | 조건                                         |
| --------------------- | ----------- | -------------------------------------------- |
| UNPROCESSABLE_ENTITY  | 422         | 필수 필드 누락                               |
| INTERNAL_SERVER_ERROR | 500         | Gemini API 호출 실패 또는 Qdrant upsert 오류 |

---

## 비즈니스 규칙

1. `content`와 `original_question`(있는 경우)을 결합하여 Gemini 모델로 정제
2. 정제 결과: 공지사항 형식의 제목(title), 교정된 내용(content), 카테고리, 출처 생성
3. 정제된 텍스트(`title + content`)를 768차원 벡터로 임베딩
4. `knowledge_id`를 Qdrant 포인트 ID로 사용하여 upsert
5. 기존 포인트가 있으면 `updated_at`, `updated_by`만 갱신 (created_at, created_by 보존)
6. 신규 포인트면 `created_at`, `updated_at` 모두 현재 시각으로 설정, `approved_by = "admin"`
