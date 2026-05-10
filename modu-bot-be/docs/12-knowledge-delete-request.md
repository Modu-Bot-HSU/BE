# POST /knowledge/:knowledgeId/delete

## 지식 삭제 요청

잘못된 정보나 불필요한 지식 항목의 삭제를 요청합니다.  
관리자 승인 시 `modu-bot-ai` 서버의 벡터 데이터가 영구 삭제됩니다.

---

## Request

**Method**: `POST`  
**Path**: `/knowledge/:knowledgeId/delete`  
**Authorization**: `Bearer <accessToken>`  
**Content-Type**: `application/json`

### Path Parameters

| 파라미터    | 타입          | 필수 | 설명                       |
| ----------- | ------------- | ---- | -------------------------- |
| knowledgeId | String (UUID) | O    | 삭제 대상 지식 항목의 ID   |

### Request Body

| 필드   | 타입   | 필수 | 설명           |
| ------ | ------ | ---- | -------------- |
| reason | String | X    | 삭제 요청 사유 |

```json
{
  "reason": "정보가 오래되어 더 이상 유효하지 않습니다."
}
```

---

## Response

**Status**: `201 Created`

### Response Body

```json
{
  "message": "삭제 요청이 제출되었습니다. 관리자 승인 후 반영됩니다.",
  "requestId": "01970000-0000-7000-8000-000000000002"
}
```

### Response Fields

| 필드      | 타입          | 설명           |
| --------- | ------------- | -------------- |
| message   | String        | 처리 결과 메시지 |
| requestId | String (UUID) | 대기 요청 ID   |

---

## Error

| 에러 코드    | HTTP Status | 조건                        |
| ------------ | ----------- | --------------------------- |
| UNAUTHORIZED | 401         | Access Token 없음 또는 만료 |

---

## 비즈니스 규칙

1. 제출 즉시 DB에 `type: DELETE`, `status: PENDING`, `knowledgeId: <대상 ID>`로 저장
2. 승인 시 AI 서버 `DELETE /api/v1/knowledge/:knowledgeId` 호출 → Qdrant에서 영구 삭제
3. 삭제 요청은 보상(토큰 지급) 대상이 아님
4. 승인 후 복구 불가
