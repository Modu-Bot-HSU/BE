# GET /users/mypage

## 마이페이지 조회

로그인한 유저의 프로필 정보, HS 토큰 잔액, 보유 NFT 목록을 조회합니다.

---

## Request

**Method**: `GET`  
**Path**: `/users/mypage`  
**Authorization**: `Bearer <accessToken>`

---

## Response

**Status**: `200 OK`

### Response Body

```json
{
  "email": "hong@hansung.ac.kr",
  "walletAddress": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
  "hsTokenBalance": "13.0",
  "nftCount": 1,
  "nfts": [
    {
      "index": 0,
      "name": "HanSung NFT #0",
      "description": "한성대학교 3D NFT 프로젝트",
      "price": "20",
      "imageUrl": "https://ipfs.io/ipfs/Qm.../01.png",
      "metadataUrl": "https://ipfs.io/ipfs/Qm.../0",
      "txHash": "0xabc123..."
    }
  ]
}
```

### Response Fields

| 필드            | 타입    | 설명                                  |
| --------------- | ------- | ------------------------------------- |
| email           | String  | 유저 이메일                           |
| walletAddress   | String  | 유저 지갑 주소                        |
| hsTokenBalance  | String  | 블록체인에서 조회한 HS 토큰 잔액      |
| nftCount        | Integer | 보유 NFT 수량                         |
| nfts            | Array   | 보유 NFT 목록                         |
| nfts[].index    | Integer | 블록체인상의 NFT 인덱스               |
| nfts[].name     | String  | NFT 이름                              |
| nfts[].description | String | NFT 설명                           |
| nfts[].price    | String  | 구매 가격 (HS 토큰)                   |
| nfts[].imageUrl | String  | NFT 이미지 URL (IPFS)                 |
| nfts[].metadataUrl | String | NFT 메타데이터 URL (IPFS)          |
| nfts[].txHash   | String  | 구매 트랜잭션 해시                    |

---

## Error

| 에러 코드             | HTTP Status | 조건                        |
| --------------------- | ----------- | --------------------------- |
| UNAUTHORIZED          | 401         | Access Token 없음 또는 만료 |
| INTERNAL_SERVER_ERROR | 500         | 블록체인 잔액 조회 오류     |

---

## 비즈니스 규칙

1. HS 토큰 잔액은 Polygon Amoy 블록체인에서 실시간 조회 (`ethers.formatEther()` 변환값)
2. 보유 NFT는 DB에 저장된 소유 기록 기준으로 조회
