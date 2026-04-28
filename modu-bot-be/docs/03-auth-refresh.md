# GET /auth/refresh

## JWT 토큰 재발급

Refresh Token을 사용하여 Access Token과 Refresh Token을 모두 재발급합니다.

---

## Request

**Method**: `GET`  
**Path**: `/auth/refresh`  
**Authorization**: `Bearer <refreshToken>`

> Access Token이 아닌 **Refresh Token**을 Authorization 헤더에 담아야 합니다.

---

## Response

**Status**: `200 OK`

### Response Body

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Fields

| 필드         | 타입   | 설명                             |
| ------------ | ------ | -------------------------------- |
| accessToken  | String | 새 JWT Access Token (유효기간 15분) |
| refreshToken | String | 새 JWT Refresh Token (유효기간 7일) |

---

## Error

| 에러 코드   | HTTP Status | 조건                              |
| ----------- | ----------- | --------------------------------- |
| FORBIDDEN   | 403         | DB에 Refresh Token이 없음         |
| FORBIDDEN   | 403         | 전달된 Refresh Token과 DB 불일치  |
| UNAUTHORIZED| 401         | 토큰 형식 오류 또는 만료          |

---

## 비즈니스 규칙

1. DB에 저장된 Refresh Token은 argon2 해시로 비교
2. 재발급 성공 시 기존 Refresh Token을 새 값으로 갱신 (Rotation)
