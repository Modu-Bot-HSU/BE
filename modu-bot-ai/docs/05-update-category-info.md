# PUT /api/v1/update_knowledge/{knowledge_id}

## 지식 베이스 수정

기존 지식 항목의 내용을 수정합니다.  
유저가 입력한 수정 내용을 AI로 재정제한 뒤 새 벡터로 임베딩하여 Qdrant를 갱신합니다.  
최초 생성자(created_by)와 생성 일시(created_at)는 보존됩니다.

---

## Request

**Method**: `PUT`  
**Path**: `/api/v1/update_knowledge/{knowledge_id}`  
**Content-Type**: `application/json`

### Path Parameters

| 파라미터     | 타입          | 필수 | 설명                       |
| ------------ | ------------- | ---- | -------------------------- |
| knowledge_id | String (UUID) | O    | 수정할 지식 항목의 고유 ID |

### Request Body

| 필드              | 타입   | 필수 | 설명                                     |
| ----------------- | ------ | ---- | ---------------------------------------- |
| wallet_address    | String | O    | 수정을 요청하는 유저의 지갑 주소         |
| category          | String | O    | 카테고리 키                              |
| content           | String | O    | 수정된 내용 (정제 전 원본)               |
| original_question | String | X    | 관련 시스템 질문. 제공 시 정제 품질 향상 |

```json
{
  "wallet_address": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
  "category": "academic",
  "content": "수강신청 기간이 7월 15일로 하루 연기되었습니다.",
  "original_question": "수강신청 날짜가 변경되었나요?"
}
```

---

## Response

**Status**: `200 OK`

### Response Body (성공)

```json
{
  "success": true,
  "message": "정보 수정 완료",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "error": null
}
```

### Response Body (실패 - 항목 없음)

```json
{
  "success": false,
  "message": null,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "해당 정보를 찾을 수 없습니다."
  }
}
```

### Response Fields

| 필드    | 타입          | 설명                  |
| ------- | ------------- | --------------------- |
| message | String        | 처리 결과 메시지      |
| data.id | String (UUID) | 수정된 지식 항목의 ID |

---

## Error

| 에러 코드             | HTTP Status | 조건                                                |
| --------------------- | ----------- | --------------------------------------------------- |
| NOT_FOUND             | 200         | `knowledge_id`에 해당하는 지식 항목이 Qdrant에 없음 |
| UNPROCESSABLE_ENTITY  | 422         | 필수 필드 누락                                      |
| INTERNAL_SERVER_ERROR | 500         | Gemini API 호출 실패 또는 Qdrant upsert 오류        |

---

## 비즈니스 규칙

1. `knowledge_id`로 Qdrant에서 기존 포인트 조회
2. 포인트가 없으면 `NOT_FOUND` 에러 반환 (HTTP 200, success: false)
3. 수정된 `content`와 `original_question`(있는 경우)을 결합하여 Gemini 모델로 재정제
4. 정제된 텍스트를 새 벡터로 임베딩하여 기존 포인트 덮어쓰기(upsert)
5. `updated_at`과 `updated_by`를 현재 시각 및 요청자 지갑 주소로 갱신
6. `created_at`과 `created_by`는 기존 값 보존
