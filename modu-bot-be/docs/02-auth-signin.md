# POST /auth/signin/request · POST /auth/signin/verify

## 로그인 (2단계 서명 인증)

지갑 서명 기반의 2단계 로그인 플로우입니다.

### 플로우

```
1. POST /auth/signin/request  → Nonce 발급
2. 클라이언트: MetaMask로 Nonce 서명
3. POST /auth/signin/verify   → 서명 검증 후 JWT 발급
```

---

## Step 1 — Nonce 요청

**Method**: `POST`  
**Path**: `/auth/signin/request`  
**Content-Type**: `application/json`

### Request Body

| 필드          | 타입   | 필수 | 설명               |
| ------------- | ------ | ---- | ------------------ |
| walletAddress | String | O    | 이더리움 지갑 주소 |

```json
{
  "walletAddress": "0xAbCdEf1234567890abcdef1234567890AbCdEf12"
}
```

### Response Body

**Status**: `201 Created`

```json
{
  "nonce": "739201"
}
```

---

## Step 2 — 서명 검증 및 JWT 발급

**Method**: `POST`  
**Path**: `/auth/signin/verify`  
**Content-Type**: `application/json`

### Request Body

| 필드          | 타입   | 필수 | 설명                          |
| ------------- | ------ | ---- | ----------------------------- |
| walletAddress | String | O    | 이더리움 지갑 주소            |
| signature     | String | O    | Nonce를 서명한 결과 (hex)     |

```json
{
  "walletAddress": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
  "signature": "0x4d2a...f1c3"
}
```

### Response Body

**Status**: `201 Created`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Fields

| 필드         | 타입   | 설명                            |
| ------------ | ------ | ------------------------------- |
| accessToken  | String | JWT Access Token (유효기간 15분)|
| refreshToken | String | JWT Refresh Token (유효기간 7일)|

---

## Error

| 에러 코드      | HTTP Status | 조건                        |
| -------------- | ----------- | --------------------------- |
| NOT_FOUND      | 404         | 가입되지 않은 지갑 주소     |
| BAD_REQUEST    | 400         | Nonce가 존재하지 않음       |
| UNAUTHORIZED   | 401         | 서명이 지갑 주소와 불일치   |

---

## 비즈니스 규칙

1. 로그인 성공 시 Nonce를 새 값으로 갱신 (Replay Attack 방지)
2. Access Token 만료 시 `/auth/refresh`로 재발급
3. JWT 페이로드: `{ sub: userId, username: name, role: "User"|"Admin" }`
