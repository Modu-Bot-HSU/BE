# POST /auth/signup/request

## 회원가입 요청 (Nonce 발급)

지갑 주소, 이름, 이메일을 등록하고 서명 검증에 사용할 Nonce를 발급합니다.  
발급된 Nonce를 MetaMask 등으로 서명한 뒤 `/auth/signin/verify`에 제출하면 로그인이 완료됩니다.

---

## Request

**Method**: `POST`  
**Path**: `/auth/signup/request`  
**Content-Type**: `application/json`

### Request Body

| 필드          | 타입   | 필수 | 설명                          |
| ------------- | ------ | ---- | ----------------------------- |
| name          | String | O    | 유저 이름 (한글/영문, 2~20자) |
| walletAddress | String | O    | 이더리움 지갑 주소            |
| email         | String | O    | 이메일 주소                   |

```json
{
  "name": "홍길동",
  "walletAddress": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
  "email": "hong@hansung.ac.kr"
}
```

---

## Response

**Status**: `201 Created`

### Response Body

```json
{
  "nonce": "482910"
}
```

### Response Fields

| 필드  | 타입   | 설명                           |
| ----- | ------ | ------------------------------ |
| nonce | String | 서명 검증용 일회성 6자리 숫자  |

---

## Error

| 에러 코드       | HTTP Status | 조건                            |
| --------------- | ----------- | ------------------------------- |
| BAD_REQUEST     | 400         | 이미 가입된 지갑 주소           |
| BAD_REQUEST     | 400         | 유효하지 않은 이름/지갑/이메일  |

---

## 비즈니스 규칙

1. 동일한 지갑 주소 또는 이메일로 중복 가입 불가
2. 이메일은 소문자로 정규화되어 저장
3. 회원가입 후 즉시 서명 검증 없이 로그인 불가 — Nonce를 서명하여 `/auth/signin/verify` 호출 필요
