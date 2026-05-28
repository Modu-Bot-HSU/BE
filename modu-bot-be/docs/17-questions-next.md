# GET /questions/next

## 다음 질문 조회

로그인한 유저에게 아직 답변하지 않은 질문을 랜덤으로 1개 반환합니다.  
하루에 받을 수 있는 질문 수에는 상한이 있으며 (기본값: 5개), 한도를 초과하거나 더 이상 답변 가능한 질문이 없으면 `data: null`을 반환합니다.

---

## Request

**Method**: `GET`  
**Path**: `/questions/next`  
**Authorization**: `Bearer <accessToken>`

---

## Response

**Status**: `200 OK`

### Case 1 — 질문 반환

```json
{
  "message": "질문 조회 성공",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "text": "다음 학기 수강신청은 언제부터인가요?",
    "category": "academic",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "remaining": 4
}
```

### Case 2 — 오늘 한도 초과

```json
{
  "message": "오늘 받을 수 있는 질문을 모두 소진했습니다.",
  "data": null,
  "remaining": 0
}
```

### Case 3 — 답변 가능한 질문 없음

```json
{
  "message": "답변 가능한 질문이 더 없습니다.",
  "data": null,
  "remaining": 3
}
```

### Response Fields

| 필드              | 타입           | 설명                                               |
| ----------------- | -------------- | -------------------------------------------------- |
| message           | String         | 처리 결과 메시지                                   |
| data              | Object \| null | 질문 객체. 한도 초과 또는 소진 시 `null`           |
| data.id           | String (UUID)  | 질문 ID. `/knowledge/submit`의 `questionId`로 사용 |
| data.text         | String         | 질문 텍스트                                        |
| data.category     | String         | 질문 카테고리                                      |
| data.isActive     | Boolean        | 활성 여부                                          |
| data.createdAt    | String         | 질문 생성 일시 (ISO 8601)                          |
| remaining         | Integer        | 오늘 남은 질문 횟수                                |

---

## Error

| 에러 코드    | HTTP Status | 조건                        |
| ------------ | ----------- | --------------------------- |
| UNAUTHORIZED | 401         | Access Token 없음 또는 만료 |

---

## 비즈니스 규칙

1. 하루 한도(`DAILY_QUESTION_LIMIT`, 기본값 5)는 당일 `CREATE` 타입 제출 수로 카운트 (REJECTED 포함)
2. `PENDING` 또는 `APPROVED` 상태의 제출이 있는 질문은 후보에서 제외 (중복 제출 방지)
3. `REJECTED`된 질문은 다시 노출 (재도전 허용)
4. 후보 질문이 없으면 `exhausted: true` 처리 → `data: null`, `remaining > 0`
