# POST /blockchain/reward

## HS 토큰 보상 지급 (관리자 전용)

챗봇 지식 기여에 대한 HS 토큰 보상을 지정된 지갑 주소로 지급합니다.  
관리자(`Admin` 역할)만 직접 호출할 수 있으며, 지식 승인 시 시스템이 자동으로 호출합니다.

---

## Request

**Method**: `POST`  
**Path**: `/blockchain/reward`  
**Authorization**: `Bearer <accessToken>` (Admin 역할 필요)  
**Content-Type**: `application/json`

### Request Body

| 필드   | 타입   | 필수 | 설명                         |
| ------ | ------ | ---- | ---------------------------- |
| to     | String | O    | 보상을 받을 유저 지갑 주소   |
| amount | String | O    | 지급할 HS 토큰 양 (ETH 단위) |

```json
{
  "to": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
  "amount": "10"
}
```

---

## Response

**Status**: `201 Created`

### Response Body

```json
{
  "message": "보상이 성공적으로 지급되었습니다.",
  "txHash": "0xabc123..."
}
```

### Response Fields

| 필드    | 타입   | 설명              |
| ------- | ------ | ----------------- |
| message | String | 처리 결과 메시지  |
| txHash  | String | 트랜잭션 해시     |

---

## Error

| 에러 코드             | HTTP Status | 조건                        |
| --------------------- | ----------- | --------------------------- |
| UNAUTHORIZED          | 401         | Access Token 없음 또는 만료 |
| FORBIDDEN             | 403         | Admin 역할 아님             |
| INTERNAL_SERVER_ERROR | 500         | 블록체인 트랜잭션 실패      |

---

## 비즈니스 규칙

1. 서버 운영자 지갑(PRIVATE_KEY)이 트랜잭션을 서명하여 가스비 대납
2. 지식 제출 승인 시 `AdminService`가 자동으로 10 HS 지급
