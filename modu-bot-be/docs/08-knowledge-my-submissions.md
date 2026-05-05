# GET /knowledge/my-submissions

## 내 제출 기록 조회

로그인한 사용자가 본인이 제출한 지식 목록과 각 제출의 처리 상태를 조회합니다.  
`status` 파라미터로 특정 상태만 필터링할 수 있으며, 결과는 최신순으로 반환됩니다.

---

## Request

**Method**: `GET`  
**Path**: `/knowledge/my-submissions`  
**Authorization**: `Bearer <accessToken>`

### Query Parameters

| 파라미터 | 타입   | 필수 | 설명                                                    |
| -------- | ------ | ---- | ------------------------------------------------------- |
| status   | String | X    | 상태 필터 (`PENDING` / `APPROVED` / `REJECTED`). 생략 시 전체 조회 |

### Request 예시

```
GET /knowledge/my-submissions
GET /knowledge/my-submissions?status=PENDING
GET /knowledge/my-submissions?status=APPROVED
```

---

## Response

**Status**: `200 OK`

### Response Body

```json
[
  {
    "id": "01970000-0000-7000-8000-000000000001",
    "type": "CREATE",
    "status": "APPROVED",
    "knowledgeId": null,
    "submittedByWallet": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
    "category": "academic",
    "content": "수강신청은 7월 14일부터이고 학년별로 날짜가 다릅니다.",
    "questionId": "550e8400-e29b-41d4-a716-446655440000",
    "originalQuestion": "다음 학기 수강신청은 언제부터인가요?",
    "rejectReason": null,
    "approvedBy": "0xAdminWallet000000000000000000000000000000",
    "approvedAt": "2026-05-05T10:00:00.000Z",
    "createdAt": "2026-05-05T09:00:00.000Z",
    "updatedAt": "2026-05-05T10:00:00.000Z"
  },
  {
    "id": "01970000-0000-7000-8000-000000000002",
    "type": "CREATE",
    "status": "REJECTED",
    "knowledgeId": null,
    "submittedByWallet": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
    "category": "scholarship",
    "content": "장학금 신청 기간입니다.",
    "questionId": "550e8400-e29b-41d4-a716-446655440001",
    "originalQuestion": "장학금 신청은 언제인가요?",
    "rejectReason": "내용이 너무 짧고 출처가 불명확합니다.",
    "approvedBy": null,
    "approvedAt": null,
    "createdAt": "2026-05-04T09:00:00.000Z",
    "updatedAt": "2026-05-04T11:00:00.000Z"
  }
]
```

### Response Fields

| 필드             | 타입           | 설명                                              |
| ---------------- | -------------- | ------------------------------------------------- |
| id               | String (UUID)  | 제출 요청 ID (UUID v7)                            |
| type             | String         | 요청 유형 (`CREATE` / `UPDATE` / `DELETE`)        |
| status           | String         | 처리 상태 (`PENDING` / `APPROVED` / `REJECTED`)   |
| knowledgeId      | String \| null | 수정·삭제 대상 지식 ID. CREATE 시 `null`          |
| submittedByWallet| String         | 제출자 지갑 주소                                  |
| category         | String         | 카테고리 키                                       |
| content          | String         | 제출한 내용                                       |
| questionId       | String \| null | 연결된 질문 ID                                    |
| originalQuestion | String \| null | 질문 텍스트 스냅샷                                |
| rejectReason     | String \| null | 거절 사유. 거절된 경우에만 값 존재                |
| approvedBy       | String \| null | 승인한 관리자 지갑 주소. 승인된 경우에만 값 존재  |
| approvedAt       | String \| null | 승인 일시 (ISO 8601). 승인된 경우에만 값 존재     |
| createdAt        | String         | 제출 일시 (ISO 8601)                              |
| updatedAt        | String         | 최종 수정 일시 (ISO 8601)                         |

---

## Error

| 에러 코드    | HTTP Status | 조건                                         |
| ------------ | ----------- | -------------------------------------------- |
| UNAUTHORIZED | 401         | Access Token 없음 또는 만료                  |
| BAD_REQUEST  | 400         | 유효하지 않은 `status` 값                    |

---

## 비즈니스 규칙

1. 본인이 제출한 기록만 조회 가능 (타인 기록 조회 불가)
2. 결과는 `createdAt` 내림차순 (최신 제출 순) 정렬
3. `PENDING` 상태 제출은 관리자 처리 전 상태
4. `REJECTED`된 질문은 다시 답변 제출 가능
