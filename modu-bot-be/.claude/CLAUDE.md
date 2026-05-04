# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

**ModuBot** — 한성대학교 학생을 위한 Web3 기반 AI 지식 공유 플랫폼 백엔드.

- 서버가 제공하는 질문 목록에 학생이 답변을 제출하면 관리자가 검토·승인
- 승인된 기여자에게 HS 토큰(ERC20) 보상 지급 (10 HS)
- NFT Shop (ERC721, HS NFT)에서 토큰으로 NFT 구매 가능
- 승인된 지식은 FastAPI + Qdrant 기반 AI 서버(RAG)와 동기화
- 이메일 인증은 한성대 도메인(`@hansung.ac.kr`)만 허용

---

## 주요 커맨드

```bash
# 개발 서버 (watch mode)
pnpm dev

# 빌드
pnpm build

# 프로덕션 실행
pnpm start:prod

# 린트 (ESLint + auto-fix)
pnpm lint

# 코드 포맷 (Prettier)
pnpm format

# 테스트
pnpm test                 # 전체 유닛 테스트
pnpm test:watch           # watch mode
pnpm test:cov             # 커버리지 포함
pnpm test:e2e             # E2E 테스트

# DB 마이그레이션
pnpm migration:generate -- --name <MigrationName>   # 엔티티 변경 감지 후 마이그레이션 파일 생성
pnpm migration:run        # 마이그레이션 실행
pnpm migration:revert     # 마지막 마이그레이션 롤백
pnpm migration:show       # 마이그레이션 상태 확인

# Docker
pnpm docker:up
pnpm docker:down
```

> `migration:generate`는 로컬 DB 환경 변수가 필요: `DB_HOST=localhost pnpm migration:generate -- --name <Name>`

---

## 아키텍처

### 모듈 구조

```
AppModule
├── ConfigModule (global)         # .env 로드
├── TypeOrmModule (global)        # PostgreSQL, 마이그레이션 관리
├── BlockchainModule (global)     # ethers.js, Polygon Amoy 웹소켓 Provider
│
├── UsersModule                   # 사용자 CRUD
├── AuthModule                    # Web3 서명 기반 인증 + JWT
├── MailModule                    # 한성대 이메일 OTP 인증
├── QuestionModule                # 질문 목록 관리 및 사용자별 랜덤 제공
├── KnowledgeModule               # 지식 제출/조회 (PENDING 상태 관리)
├── AdminModule                   # 지식 승인/거절, AI 서버 동기화, 토큰 보상
├── AiClientModule                # FastAPI 백엔드 HTTP 클라이언트
└── SeederModule                  # 앱 시작 시 Admin 계정 + 초기 질문 자동 생성
```

### 인증 흐름 (Web3 Signature)

1. 클라이언트가 지갑 주소로 `/auth/signup` 또는 `/auth/signin` 요청 → 서버에서 랜덤 nonce 반환
2. 클라이언트가 MetaMask로 nonce 서명 → signature를 서버로 전송
3. `ethers.verifyMessage(nonce, signature)`로 주소 검증
4. 검증 성공 → JWT access token(15분) + refresh token(7일) 발급
5. nonce는 매 로그인마다 재생성 (재사용 방지)
6. Refresh token은 Argon2로 해시하여 DB에 저장

### 질문 제공 흐름

```
GET /questions/next  (AccessToken 필요)
  → 오늘 CREATE 제출 횟수 카운트 (REJECTED 포함)
    → 한도(DAILY_QUESTION_LIMIT, 기본 5) 초과 시 → { data: null, remaining: 0 }
  → PENDING·APPROVED 상태 제출의 questionId 목록 조회 (제외 목록)
    → 후보 questions 중 랜덤 1개 반환
    → 답할 질문 없으면 → { data: null, exhausted: true }
```

- REJECTED된 질문은 다시 노출 (재도전 허용)
- PENDING·APPROVED된 질문은 영구 제외

### 지식 관리 흐름

```
사용자 제출 (CREATE/UPDATE/DELETE)
  → PendingKnowledge 생성 (status: PENDING)
    → CREATE: questionId + 질문 텍스트(originalQuestion) 함께 저장
    → 관리자 승인
      → AiClientService로 FastAPI에 sync (insert/update/delete)
      → 제출자 지갑에 HS 토큰 10개 보상 (TokenService, CREATE만)
    → 관리자 거절
      → status: REJECTED, rejectReason 저장
```

### BlockchainModule (Global)

- `TokenService`: HS ERC20 토큰 잔액 조회, 토큰 보상 지급, 사용자 approval
- `NftService`: NFT 목록/구매 (서버 가스 대납), on-chain 이벤트 리스닝
- Polygon Amoy testnet, Alchemy WebSocket Provider 사용
- WebSocket 단절 시 5초 후 자동 재연결 로직 존재

### AiClientModule

- FastAPI 서버(`FAST_API_HOST:FAST_API_PORT`)와 REST 통신
- 지식 CRUD: `getKnowledge`, `insertKnowledge`, `updateKnowledge`, `deleteKnowledge`
- `getKnowledge`: category 생략 시 전체 조회, 지정 시 카테고리 필터
- AdminModule이 지식 승인 시 직접 호출 (큐/재시도 없음)

---

## DB / TypeORM

- `synchronize: false` — 엔티티 변경 시 반드시 마이그레이션 생성 후 실행
- `migrationsRun: true` — 프로덕션 기동 시 자동 실행
- 마이그레이션 파일 위치: `src/migrations/`
- 엔티티 위치: `src/**/*.entity.ts`

### 주요 엔티티

| 엔티티 | 특이사항 |
|---|---|
| `Users` | UUID PK, walletAddress(unique, 42자), role(USER/ADMIN), refreshToken(Argon2 해시) |
| `NftProduct` | index 0–19 고정, price 기본값 "20"(HS 토큰), isSold 플래그 |
| `Question` | UUID PK(자동), text, category, isActive. 앱 시작 시 QuestionSeeder가 테이블 없으면 자동 생성 + 25개 초기 데이터 삽입 |
| `PendingKnowledge` | UUID v7 수동 생성, type(CREATE/UPDATE/DELETE), status(PENDING/APPROVED/REJECTED), questionId(Question UUID 참조) |

---

## 공통 패턴

### Guards / Decorators

```typescript
// 인증 + 권한 조합 예시
@Roles(UsersRole.ADMIN)
@UseGuards(AccessTokenGuard, RolesGuard)

// JWT payload에서 값 추출
@GetCurrentUserId()          // sub (userId)
@GetCurrentUser('walletAddress')  // 특정 필드
```

### Global ValidationPipe (main.ts)

- `whitelist: true` — 선언되지 않은 필드 자동 제거
- `forbidNonWhitelisted: true` — 추가 필드 있으면 400 에러
- `transform: true` — DTO 타입 자동 변환

### API 응답 포맷

```typescript
{ message: string, data?: object }

// GET /questions/next 추가 필드
{ message: string, data: Question | null, remaining: number }
```

---

## 주요 API 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| GET | `/questions/next` | AccessToken | 사용자별 랜덤 질문 1개 (하루 최대 5개) |
| GET | `/knowledge` | 없음 | 지식 조회 (category 생략 시 전체, 커서 페이지네이션) |
| POST | `/knowledge/submit` | AccessToken | 질문 답변 제출 (questionId + content) |
| POST | `/knowledge/:id/update` | AccessToken | 기존 지식 수정 요청 |
| POST | `/knowledge/:id/delete` | AccessToken | 기존 지식 삭제 요청 |
| GET | `/admin/pending-requests` | AccessToken + ADMIN | 대기 목록 조회 |
| POST | `/admin/approve/:id` | AccessToken + ADMIN | 승인 (Qdrant sync + 토큰 보상) |
| POST | `/admin/reject/:id` | AccessToken + ADMIN | 거절 |

---

## 환경 변수 (주요)

| 변수 | 설명 |
|---|---|
| `DB_HOST/PORT/USERNAME/PASSWORD/DATABASE` | PostgreSQL 연결 |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT 서명 키 |
| `PRIVATE_KEY` | 서버 admin 지갑 (토큰 보상, 가스 대납) |
| `HS_TOKEN_ADDRESS` / `HS_NFT_ADDRESS` | Polygon Amoy 컨트랙트 주소 |
| `AMOI_WSS_URL` | Alchemy WebSocket URL |
| `FAST_API_HOST` / `FAST_API_PORT` | AI 서버 주소 (기본: localhost:8000) |
| `MAIL_USER` / `MAIL_PASSWORD` | Gmail SMTP |
| `ADMIN_EMAIL` / `ADMIN_WALLET` | Seeder에서 admin 계정 생성에 사용 |
| `FRONTEND_URL` | CORS 허용 도메인 (비어있으면 전체 허용) |
| `DAILY_QUESTION_LIMIT` | 사용자 하루 최대 질문 답변 횟수 (기본값: 5) |

---

## 알려진 제약사항 / TODO

- 이메일 인증 코드 저장소가 In-Memory Map → 서버 재시작 시 초기화, Redis 마이그레이션 필요
- FastAPI 동기화에 큐/재시도 로직 없음 (AI 서버 다운 시 승인은 되지만 sync 실패)
- `GET /admin/pending-requests`에 `relations: ['submittedBy']` 누락 → 제출자 상세 정보 미포함
- AI 서버 sync 성공 후 DB 저장 실패 시 Qdrant와 불일치 가능 (트랜잭션 없음)
- `.env` 파일에 민감 정보 직접 커밋되어 있음 (로컬 개발용)
