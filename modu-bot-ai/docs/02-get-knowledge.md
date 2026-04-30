# GET /api/v1/knowledge

## 지식 베이스 조회

지식 베이스 항목 목록을 커서 기반 페이지네이션으로 조회합니다.  
`category`를 생략하면 전체 조회, 지정하면 카테고리 필터 조회입니다.

---

## Request

**Method**: `GET`  
**Path**: `/api/v1/knowledge`

### Query Parameters

| 파라미터 | 타입    | 필수 | 설명                                                        |
| -------- | ------- | ---- | ----------------------------------------------------------- |
| category | String  | X    | 조회할 카테고리 키. 생략 시 전체 조회                       |
| limit    | Integer | X    | 한 번에 조회할 최대 개수 (기본값: 50)                       |
| offset   | String  | X    | 마지막으로 읽은 데이터의 ID (커서). 첫 요청 시 생략         |

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

### Request 예시

```
GET /api/v1/knowledge                                                      # 전체 조회
GET /api/v1/knowledge?category=scholarship                                 # 카테고리 필터
GET /api/v1/knowledge?category=scholarship&limit=10                        # 페이지 크기 지정
GET /api/v1/knowledge?category=scholarship&limit=10&offset=550e8400-...    # 다음 페이지
```

---

## Response

**Status**: `200 OK`

### Response Body

```json
{
  "success": true,
  "message": null,
  "data": {
    "total_count": 2,
    "knowledges": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "category": "scholarship",
        "title": "국가장학금 1유형 신청 안내",
        "content": "국가장학금 1유형 신청 기간은 5월 1일부터 5월 31일까지입니다. 한국장학재단 홈페이지에서 신청 가능합니다.",
        "source": "장학팀 공지사항",
        "created_at": "2025-05-01T09:00:00",
        "updated_at": "2025-05-01T09:00:00",
        "created_by": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
        "updated_by": "0xAbCdEf1234567890abcdef1234567890AbCdEf12",
        "approved_by": "admin"
      }
    ],
    "next_offset": null
  },
  "error": null
}
```

### Response Fields

| 필드                          | 타입              | 설명                                               |
| ----------------------------- | ----------------- | -------------------------------------------------- |
| data.total_count              | Integer           | 조회 대상 전체 항목 수 (카테고리 필터 또는 전체)   |
| data.knowledges               | Array             | 조회된 지식 항목 목록                              |
| data.knowledges[].id          | String (UUID)     | Qdrant 포인트 ID                                   |
| data.knowledges[].category    | String            | 카테고리 키                                        |
| data.knowledges[].title       | String            | AI가 생성한 제목                                   |
| data.knowledges[].content     | String            | AI가 정제한 내용                                   |
| data.knowledges[].source      | String            | 정보 출처                                          |
| data.knowledges[].created_at  | String (ISO 8601) | 생성 일시                                          |
| data.knowledges[].updated_at  | String (ISO 8601) | 최종 수정 일시                                     |
| data.knowledges[].created_by  | String            | 최초 기여자 지갑 주소                              |
| data.knowledges[].updated_by  | String            | 최종 수정자 지갑 주소                              |
| data.knowledges[].approved_by | String            | 승인자                                             |
| data.next_offset              | String \| null    | 다음 페이지 커서. null이면 마지막 페이지           |

---

## Error

| 에러 코드             | HTTP Status | 조건              |
| --------------------- | ----------- | ----------------- |
| INTERNAL_SERVER_ERROR | 500         | 벡터 DB 조회 오류 |

---

## 비즈니스 규칙

1. `category` 파라미터가 있으면 해당 카테고리 필터링, 없으면 전체 조회
2. Qdrant scroll API를 사용하여 커서 기반 페이지네이션 처리
3. 벡터값은 반환하지 않고 payload만 반환
4. `limit` 기본값은 50
5. `next_offset`이 null이면 더 이상 데이터 없음 (마지막 페이지)
6. 다음 페이지 조회 시 `next_offset` 값을 `offset` 파라미터로 전달
