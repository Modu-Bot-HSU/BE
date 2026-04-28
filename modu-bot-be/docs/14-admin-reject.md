# POST /admin/reject/:requestId

## 지식 요청 반려 (관리자 전용)

대기 중인 지식 요청을 반려합니다.  
반려 사유를 기록할 수 있으며, AI 서버와의 동기화 없이 DB 상태만 변경됩니다.

---

## Request

**Method**: `POST`  
**Path**: `/admin/reject/:requestId`  
**Authorization**: `Bearer <accessToken>` (Admin 역할 필요)  
**Content-Type**: `application/json`

### Path Parameters

| 파라미터  | 타입          | 필수 | 설명               |
| --------- | ------------- | ---- | ------------------ |
| requestId | String (UUID) | O    | 반려할 요청의 ID   |

### Request Body

| 필드   | 타입   | 필수 | 설명       |
| ------ | ------ | ---- | ---------- |
| reason | String | X    | 반려 사유  |

```json
{
  "reason": "정보 출처가 불명확합니다. 공식 공지사항 링크를 포함하여 재제출해 주세요."
}
```

---

## Response

**Status**: `201 Created`

### Response Body

```json
{
  "message": "반려 처리되었습니다.",
  "requestId": "01970000-0000-7000-8000-000000000000",
  "status": "REJECTED"
}
```

### Response Fields

| 필드      | 타입   | 설명              |
| --------- | ------ | ----------------- |
| message   | String | 처리 결과 메시지  |
| requestId | String | 반려된 요청 ID    |
| status    | String | `REJECTED`        |

---

## Error

| 에러 코드    | HTTP Status | 조건                                 |
| ------------ | ----------- | ------------------------------------ |
| UNAUTHORIZED | 401         | Access Token 없음 또는 만료          |
| FORBIDDEN    | 403         | Admin 역할 아님                      |
| NOT_FOUND    | 404         | 요청 ID를 찾을 수 없음               |
| BAD_REQUEST  | 400         | 이미 처리된 요청 (APPROVED/REJECTED) |

---

## 비즈니스 규칙

1. AI 서버 호출 없이 DB 상태만 `REJECTED`로 변경
2. `reason` 생략 시 `rejectReason` 필드는 null로 저장
3. 반려된 요청은 재제출이 불가하며, 유저가 새로운 요청을 생성해야 함
