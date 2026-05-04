# POST /mail/send · POST /mail/verify

## 이메일 인증 (대학교 인증)

학교 이메일 인증을 통해 유저의 `isVerified` 상태를 활성화합니다.

### 플로우

```
1. POST /mail/send   → 인증 코드 이메일 발송
2. POST /mail/verify → 코드 검증 후 isVerified = true 처리
```

> 두 엔드포인트 모두 Access Token이 필요합니다.

---

## Step 1 — 인증 코드 발송

**Method**: `POST`  
**Path**: `/mail/send`  
**Authorization**: `Bearer <accessToken>`  
**Content-Type**: `application/json`

### Request Body

| 필드  | 타입   | 필수 | 설명                |
| ----- | ------ | ---- | ------------------- |
| email | String | O    | 인증할 이메일 주소  |

```json
{
  "email": "hong@hansung.ac.kr"
}
```

### Response Body

**Status**: `201 Created`

```json
{
  "message": "인증 코드가 발송되었습니다."
}
```

---

## Step 2 — 인증 코드 검증

**Method**: `POST`  
**Path**: `/mail/verify`  
**Authorization**: `Bearer <accessToken>`  
**Content-Type**: `application/json`

### Request Body

| 필드  | 타입   | 필수 | 설명              |
| ----- | ------ | ---- | ----------------- |
| email | String | O    | 인증할 이메일     |
| code  | String | O    | 발송된 인증 코드  |

```json
{
  "email": "hong@hansung.ac.kr",
  "code": "391027"
}
```

### Response Body

**Status**: `201 Created`

```json
{
  "message": "이메일 인증이 완료되었습니다."
}
```

---

## Error

| 에러 코드    | HTTP Status | 조건                          |
| ------------ | ----------- | ----------------------------- |
| UNAUTHORIZED | 401         | Access Token 없음 또는 만료   |
| BAD_REQUEST  | 400         | 코드 불일치 또는 만료         |

---

## 비즈니스 규칙

1. 인증 코드는 만료 시간이 존재하며 만료된 코드는 GC(Garbage Collection)됨
2. 검증 성공 시 유저의 `isVerified` 필드가 `true`로 업데이트됨
