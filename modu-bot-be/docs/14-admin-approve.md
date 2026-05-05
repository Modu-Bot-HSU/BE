# POST /admin/approve/:requestId

## 지식 요청 승인 (관리자 전용)

대기 중인 지식 등록/수정/삭제 요청을 승인합니다.  
승인 시 `modu-bot-ai` 서버와 동기화하고, CREATE 요청의 경우 제출자에게 HS 토큰을 지급합니다.

---

## Request

**Method**: `POST`  
**Path**: `/admin/approve/:requestId`  
**Authorization**: `Bearer <accessToken>` (Admin 역할 필요)

### Path Parameters

| 파라미터  | 타입          | 필수 | 설명               |
| --------- | ------------- | ---- | ------------------ |
| requestId | String (UUID) | O    | 승인할 요청의 ID   |

### Request 예시

```
POST /admin/approve/01970000-0000-7000-8000-000000000000
```

---

## Response

**Status**: `201 Created`

### Response Body

```json
{
  "message": "승인이 완료되었습니다.",
  "requestId": "01970000-0000-7000-8000-000000000000",
  "status": "APPROVED"
}
```

### Response Fields

| 필드      | 타입   | 설명              |
| --------- | ------ | ----------------- |
| message   | String | 처리 결과 메시지  |
| requestId | String | 승인된 요청 ID    |
| status    | String | `APPROVED`        |

---

## Error

| 에러 코드             | HTTP Status | 조건                            |
| --------------------- | ----------- | ------------------------------- |
| UNAUTHORIZED          | 401         | Access Token 없음 또는 만료     |
| FORBIDDEN             | 403         | Admin 역할 아님                 |
| NOT_FOUND             | 404         | 요청 ID를 찾을 수 없음          |
| BAD_REQUEST           | 400         | 이미 처리된 요청 (APPROVED/REJECTED) |
| INTERNAL_SERVER_ERROR | 500         | AI 서버 동기화 실패             |

---

## 비즈니스 규칙

1. AI 서버 동기화 성공 후에만 DB 상태를 `APPROVED`로 변경
2. AI 서버 실패 시 예외 throw — DB 상태 변경 없음 (재시도 가능)
3. `CREATE` 요청만 보상 지급 (10 HS). `UPDATE`/`DELETE`는 보상 없음
4. 보상 지급 실패는 승인을 롤백하지 않음 (별도 로그 기록)
5. 요청 유형별 AI 서버 호출:
   - `CREATE` → `POST /api/v1/knowledge`
   - `UPDATE` → `PUT /api/v1/update_knowledge/:knowledgeId`
   - `DELETE` → `DELETE /api/v1/knowledge/:knowledgeId`
