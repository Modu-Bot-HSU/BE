# GET /blockchain/nft/goods · POST /blockchain/nft/purchase

## NFT 상점

한성대학교 NFT 상품 목록 조회 및 구매를 처리합니다.

---

## NFT 목록 조회

**Method**: `GET`  
**Path**: `/blockchain/nft/goods`  
**Authorization**: `Bearer <accessToken>`

### Response Body

**Status**: `200 OK`

```json
[
  {
    "id": 1,
    "index": 0,
    "name": "HanSung NFT #0",
    "description": "한성대학교 3D NFT 프로젝트",
    "price": "20",
    "imageUrl": "https://ipfs.io/ipfs/Qm.../01.png",
    "metadataUrl": "https://ipfs.io/ipfs/Qm.../0",
    "isSold": false,
    "txHash": null,
    "owner": null,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### Response Fields

| 필드        | 타입    | 설명                              |
| ----------- | ------- | --------------------------------- |
| index       | Integer | 블록체인상의 NFT 인덱스 (0~4)     |
| price       | String  | 가격 (HS 토큰, ETH 단위)          |
| isSold      | Boolean | 판매 여부                         |
| txHash      | String  | 구매 트랜잭션 해시 (미판매 시 null)|
| owner       | Object  | 소유자 유저 정보 (미판매 시 null) |

---

## NFT 구매

**Method**: `POST`  
**Path**: `/blockchain/nft/purchase`  
**Authorization**: `Bearer <accessToken>`  
**Content-Type**: `application/json`

### Request Body

| 필드  | 타입    | 필수 | 설명                     |
| ----- | ------- | ---- | ------------------------ |
| index | Integer | O    | 구매할 NFT 인덱스 (0~4)  |

```json
{
  "index": 0
}
```

### Response Body

**Status**: `201 Created`

```json
{
  "message": "NFT 구매가 완료되었습니다.",
  "txHash": "0xabc123..."
}
```

---

## Error

| 에러 코드             | HTTP Status | 조건                          |
| --------------------- | ----------- | ----------------------------- |
| UNAUTHORIZED          | 401         | Access Token 없음 또는 만료   |
| INTERNAL_SERVER_ERROR | 500         | 블록체인 트랜잭션 실패        |

---

## 비즈니스 규칙

1. 목록 조회 시 블록체인 판매 상태와 DB를 실시간 동기화
2. 구매 시 서버가 가스비를 대납하여 유저 대신 트랜잭션 전송 (`buyNftForUser`)
3. 구매 가격: 20 HS 토큰 (유저 지갑에서 차감)
4. 구매 성공 시 DB에 소유자 및 트랜잭션 해시 기록
