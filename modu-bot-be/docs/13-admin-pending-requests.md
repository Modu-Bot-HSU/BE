# GET /admin/pending-requests

## 대기 요청 목록 조회 (관리자 전용)

유저가 제출한 지식 등록/수정/삭제 대기 요청 목록을 조회합니다.

---

## Request

**Method**: `GET`  
**Path**: `/admin/pending-requests`  
**Authorization**: `Bearer <accessToken>` (Admin 역할 필요)

### Query Parameters

| 파라미터 | 타입   | 필수 | 설명                                              |
| -------- | ------ | ---- | ------------------------------------------------- |
| status   | String | X    | 필터할 상태 (`PENDING` \| `APPROVED` \| `REJECTED`). 생략 시 `PENDING` |

### Request 예시

```
GET /admin/pending-requests
GET /admin/pending-requests?status=APPROVED
```

---

## Response

**Status**: `200 OK`

### Response Body

```json
[
  {
    "id": "01970000-0000-7000-8000-000000000000",
    "type": "CREATE",
    "status": "PENDING",
    "knowledgeId": null,
    "submittedByWallet": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
    "category": "academic",
    "content": "수강신청은 7월 14일부터입니다.",
    "originalQuestion": "수강신청은 언제부터인가요?",
    "rejectReason": null,
    "approvedBy": null,
    "approvedAt": null,
    "createdAt": "2025-05-01T09:00:00.000Z",
    "updatedAt": "2025-05-01T09:00:00.000Z"
  }
]
```

### Response Fields

| 필드              | 타입           | 설명                                          |
| ----------------- | -------------- | --------------------------------------------- |
| id                | String (UUID)  | 요청 ID (UUID v7). CREATE 시 Qdrant ID로 사용 |
| type              | String         | 요청 유형 (`CREATE` \| `UPDATE` \| `DELETE`)  |
| status            | String         | 처리 상태 (`PENDING` \| `APPROVED` \| `REJECTED`) |
| knowledgeId       | String \| null | UPDATE/DELETE 시 대상 지식 항목의 Qdrant ID   |
| submittedByWallet | String         | 제출자 지갑 주소                              |
| category          | String         | 카테고리 키                                   |
| content           | String         | 유저 원본 제출 내용                           |
| originalQuestion  | String \| null | 관련 질문 (제출 시 입력한 경우)               |
| rejectReason      | String \| null | 반려 사유 (반려 처리 시 기록)                 |
| approvedBy        | String \| null | 승인자 지갑 주소                              |
| approvedAt        | String \| null | 승인 일시                                     |

---

## Error

| 에러 코드    | HTTP Status | 조건                        |
| ------------ | ----------- | --------------------------- |
| UNAUTHORIZED | 401         | Access Token 없음 또는 만료 |
| FORBIDDEN    | 403         | Admin 역할 아님             |

---

## 비즈니스 규칙

1. 기본 정렬: `createdAt ASC` (오래된 요청 먼저)
2. `status` 파라미터 생략 시 `PENDING` 상태만 반환
