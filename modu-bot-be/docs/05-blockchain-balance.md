# GET /blockchain/balance

## HS 토큰 잔액 조회

로그인된 유저의 지갑 주소를 기반으로 블록체인에서 HS 토큰 잔액을 조회합니다.

---

## Request

**Method**: `GET`  
**Path**: `/blockchain/balance`  
**Authorization**: `Bearer <accessToken>`

---

## Response

**Status**: `200 OK`

### Response Body

```json
{
  "address": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
  "balance": "100.0",
  "symbol": "HS"
}
```

### Response Fields

| 필드    | 타입   | 설명                    |
| ------- | ------ | ----------------------- |
| address | String | 유저 지갑 주소          |
| balance | String | HS 토큰 잔액 (ETH 단위) |
| symbol  | String | 토큰 심볼 (`HS`)        |

---

## Error

| 에러 코드             | HTTP Status | 조건                        |
| --------------------- | ----------- | --------------------------- |
| UNAUTHORIZED          | 401         | Access Token 없음 또는 만료 |
| INTERNAL_SERVER_ERROR | 500         | 블록체인 조회 오류          |

---

## 비즈니스 규칙

1. Polygon Amoy 테스트넷의 HS 토큰 컨트랙트에서 실시간 조회
2. 잔액은 `ethers.formatEther()`로 변환한 소수 문자열
