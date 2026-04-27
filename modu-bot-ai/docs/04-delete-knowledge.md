# DELETE /api/v1/knowledge/{knowledge_id}

## 지식 베이스 삭제

지정한 `knowledge_id`에 해당하는 지식 항목을 Qdrant 벡터 DB에서 완전히 삭제합니다.

---

## Request

**Method**: `DELETE`  
**Path**: `/api/v1/knowledge/{knowledge_id}`

### Path Parameters

| 파라미터     | 타입          | 필수 | 설명                       |
| ------------ | ------------- | ---- | -------------------------- |
| knowledge_id | String (UUID) | O    | 삭제할 지식 항목의 고유 ID |

### Request 예시

```
DELETE /api/v1/knowledge/550e8400-e29b-41d4-a716-446655440000
```

---

## Response

**Status**: `200 OK`

### Response Body

```json
{
  "success": true,
  "message": "삭제 완료",
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
| data.id | String (UUID) | 삭제된 지식 항목의 ID |

---

## Error

| 에러 코드             | HTTP Status | 조건             |
| --------------------- | ----------- | ---------------- |
| INTERNAL_SERVER_ERROR | 500         | Qdrant 삭제 오류 |

---

## 비즈니스 규칙

1. Qdrant에서 해당 `knowledge_id`의 포인트를 영구 삭제
2. 존재하지 않는 ID를 삭제 요청해도 오류 없이 정상 응답 반환 (Qdrant 기본 동작)
3. 삭제 후 복구 불가
