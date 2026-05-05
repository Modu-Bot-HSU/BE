# POST /knowledge/:knowledgeId/update

## 지식 수정 요청

기존 지식 항목에 대한 수정을 제안합니다.  
관리자 승인 전까지는 원본 데이터가 유지되며, 승인 시 `modu-bot-ai` 서버의 해당 벡터가 갱신됩니다.

---

## Request

**Method**: `POST`  
**Path**: `/knowledge/:knowledgeId/update`  
**Authorization**: `Bearer <accessToken>`  
**Content-Type**: `application/json`

### Path Parameters

| 파라미터    | 타입          | 필수 | 설명                       |
| ----------- | ------------- | ---- | -------------------------- |
| knowledgeId | String (UUID) | O    | 수정 대상 지식 항목의 ID   |

### Request Body

| 필드             | 타입   | 필수 | 설명                                    |
| ---------------- | ------ | ---- | --------------------------------------- |
| category         | String | O    | 카테고리 키                             |
| content          | String | O    | 수정된 내용 (원본 텍스트)               |
| originalQuestion | String | X    | 관련 질문. 제공 시 AI 정제 품질 향상    |

```json
{
  "category": "academic",
  "content": "수강신청 기간이 7월 15일로 하루 연기되었습니다.",
  "originalQuestion": "수강신청 날짜가 변경되었나요?"
}
```

---

## Response

**Status**: `201 Created`

### Response Body

```json
{
  "message": "수정 요청이 제출되었습니다. 관리자 승인 후 반영됩니다.",
  "requestId": "01970000-0000-7000-8000-000000000001"
}
```

### Response Fields

| 필드      | 타입          | 설명                                       |
| --------- | ------------- | ------------------------------------------ |
| message   | String        | 처리 결과 메시지                           |
| requestId | String (UUID) | 대기 요청 ID (UUID v7)                     |

---

## Error

| 에러 코드    | HTTP Status | 조건                                       |
| ------------ | ----------- | ------------------------------------------ |
| UNAUTHORIZED | 401         | Access Token 없음 또는 만료                |
| BAD_REQUEST  | 400         | 필수 필드 누락 또는 유효하지 않은 category |

---

## 비즈니스 규칙

1. 제출 즉시 DB에 `type: UPDATE`, `status: PENDING`, `knowledgeId: <대상 ID>`로 저장
2. 원본 지식은 승인 전까지 변경되지 않음
3. 승인 시 AI 서버 `PUT /api/v1/update_knowledge/:knowledgeId` 호출
4. 수정 요청은 보상(토큰 지급) 대상이 아님
