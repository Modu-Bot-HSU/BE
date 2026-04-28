# POST /knowledge/submit

## 지식 제출

학교 생활 관련 정보를 제출합니다.  
제출된 내용은 즉시 반영되지 않고 `PENDING` 상태로 DB에 저장되며, 관리자 승인 후 RAG 지식 베이스에 등록됩니다.  
승인 시 제출자에게 10 HS 토큰이 지급됩니다.

---

## Request

**Method**: `POST`  
**Path**: `/knowledge/submit`  
**Authorization**: `Bearer <accessToken>`  
**Content-Type**: `application/json`

### Request Body

| 필드             | 타입   | 필수 | 설명                                     |
| ---------------- | ------ | ---- | ---------------------------------------- |
| category         | String | O    | 카테고리 키 (아래 목록 참고)             |
| content          | String | O    | 제출할 정보 내용 (원본 텍스트)           |
| originalQuestion | String | X    | 관련 질문. 제공 시 AI 정제 품질 향상     |

### 카테고리 목록

| 키          | 한국어 명칭 |
| ----------- | ----------- |
| academic    | 학사일정    |
| scholarship | 장학        |
| facility    | 편의시설    |
| campus_life | 학교 생활   |
| career      | 취업/진로   |
| it_service  | IT 서비스   |
| support     | 학생 지원   |
| etc         | 기타        |

```json
{
  "category": "academic",
  "content": "수강신청은 7월 14일부터이고 학년별로 날짜가 다릅니다.",
  "originalQuestion": "다음 학기 수강신청은 언제부터인가요?"
}
```

---

## Response

**Status**: `201 Created`

### Response Body

```json
{
  "message": "지식이 제출되었습니다. 관리자 승인 후 반영됩니다.",
  "requestId": "01970000-0000-7000-8000-000000000000"
}
```

### Response Fields

| 필드      | 타입          | 설명                              |
| --------- | ------------- | --------------------------------- |
| message   | String        | 처리 결과 메시지                  |
| requestId | String (UUID) | 대기 요청 ID (UUID v7). 승인/반려 조회에 사용 |

---

## Error

| 에러 코드    | HTTP Status | 조건                        |
| ------------ | ----------- | --------------------------- |
| UNAUTHORIZED | 401         | Access Token 없음 또는 만료 |
| BAD_REQUEST  | 400         | 필수 필드 누락 또는 유효하지 않은 category |

---

## 비즈니스 규칙

1. 제출 즉시 DB에 `type: CREATE`, `status: PENDING`으로 저장
2. `requestId`는 UUID v7 형식 (타임스탬프 정렬 가능)
3. 관리자 승인 시 동일한 `requestId`가 Qdrant 포인트 ID로 사용됨
4. 승인 후 제출자 지갑으로 10 HS 토큰 자동 지급
