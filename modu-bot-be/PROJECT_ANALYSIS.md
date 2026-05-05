# ModuBot NestJS Backend — 프로젝트 분석

## 0. 프로젝트 개요

한성대학교 학생을 대상으로 하는 챗봇 플랫폼의 백엔드 서버.
Web3 지갑 기반 인증, 이메일 인증(한성대 도메인), ERC-20 토큰 보상, NFT 구매 기능을 제공한다.

- **Framework:** NestJS 11.x (TypeScript)
- **DB:** PostgreSQL + TypeORM
- **Blockchain:** ethers.js v6 (Ethereum-compatible chain)
- **Auth:** JWT (Access Token 15분 / Refresh Token 7일) + Passport
- **Email:** Nodemailer + Handlebars 템플릿

---

## 1. 시스템 아키텍처

```
Client (지갑 서명)
    │
    ▼
NestJS Backend (이 레포)        ←→   PostgreSQL
    │
    ├── 인증 (Web3 서명 + JWT)
    ├── 이메일 인증 (한성대 도메인)
    ├── 토큰 잔액 조회 / 보상 지급
    └── NFT 구매 / 인벤토리 조회
    │
    ▼
FastAPI AI Server  (별도 레포)  ←→   Qdrant (벡터 DB)
Blockchain Network (WebSocket)
```

### 요청 흐름

1. 클라이언트가 지갑으로 Nonce 서명 → 서버가 서명 검증 → JWT 발급
2. 한성대 이메일 인증 후 `isVerified=true` 설정
3. 관리자가 토큰 보상 → ERC-20 Transfer 온체인 실행
4. 유저가 NFT 구매 → 서버가 대신 가스비 지불 (Approve → Purchase)

---

## 2. 모듈 구성

| 모듈 | 위치 | 역할 |
|------|------|------|
| AppModule | `src/app.module.ts` | 루트 모듈 |
| AuthModule | `src/auth/` | Web3 서명 인증, JWT 발급 |
| UsersModule | `src/users/` | 사용자 CRUD |
| MailModule | `src/mail/` | 이메일 인증 코드 발송/검증 |
| BlockchainModule | `src/blockchain/` | 토큰·NFT 온체인 연동 |

---

## 3. DB 엔티티 관계

```
Users (1) ──── (N) NftProducts
  id (UUID, PK)         id (SERIAL, PK)
  name                  index (0~4, UNIQUE)
  email (UNIQUE)        name / description / price
  walletAddress (UNIQUE) imageUrl / metadataUrl
  nonce                 isSold
  isVerified            txHash
  role (USER|ADMIN)     owner_id (FK → Users, nullable)
  refreshToken (hashed)
```

---

## 4. 전체 API 엔드포인트

### Auth (`/auth`)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/auth/signup/request` | 회원가입 Nonce 발급 | X |
| POST | `/auth/signin/request` | 로그인 Nonce 발급 | X |
| POST | `/auth/signin/verify` | 서명 검증 → JWT 발급 | X |
| GET | `/auth/refresh` | 액세스 토큰 재발급 | RefreshTokenGuard |

### Mail (`/mail`)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/mail/send` | 인증 코드 발송 (한성대 도메인 한정) | AccessTokenGuard |
| POST | `/mail/verify` | 인증 코드 검증 | AccessTokenGuard |

### Blockchain (`/blockchain`)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/blockchain/balance` | 토큰 잔액 조회 | AccessTokenGuard |
| POST | `/blockchain/reward` | 토큰 보상 지급 (관리자) | AccessTokenGuard + RolesGuard |
| GET | `/blockchain/nft/goods` | NFT 인벤토리 조회 | AccessTokenGuard |
| POST | `/blockchain/nft/purchase` | NFT 구매 | AccessTokenGuard |
| GET | `/blockchain/approve-user-test` | 테스트용 토큰 Approve | X (무인증) |

### Root

| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 헬스체크 |

---

## 5. 기능 상세

### 5.1 Web3 인증 흐름

```
1. POST /auth/signup/request  → DB에 유저 생성, Nonce 반환
2. 클라이언트가 nonce를 지갑으로 서명
3. POST /auth/signin/verify   → 서명 검증(ethers.verifyMessage), JWT 발급
4. GET  /auth/refresh         → Refresh Token으로 Access Token 재발급
```

### 5.2 이메일 인증 흐름

```
1. POST /mail/send   → 6자리 코드 생성, 한성대 이메일로 발송 (5분 유효)
2. POST /mail/verify → 코드 일치 시 users.isVerified = true
```

코드는 서버 메모리에 저장 (`Map<email, {code, expiredAt}>`).

### 5.3 NFT 구매 흐름

```
1. POST /blockchain/nft/purchase  (index 전달)
2. 서버 지갑 → 유저 대신 NftContract.approve 호출
3. 서버 지갑 → NftContract.purchase 호출
4. 온체인 이벤트 NftPurchased 수신 → DB isSold=true, owner_id 업데이트
```

### 5.4 블록체인 이벤트 리스너

NftService, TokenService 모두 WebSocket RPC로 이벤트를 구독한다.
연결 실패 시 5초 후 재접속하며 재시도 횟수 제한이 없다.

---

## 6. 발견된 문제점

### CRITICAL

#### C-1. 암호학적으로 취약한 Nonce 생성
- **위치:** `src/auth/auth.service.ts` (Nonce 생성 부분)
- **문제:** `Math.floor(Math.random() * 1_000_000)` 사용 → 최대 6자리(100만 가지)
- `Math.random()`은 암호학적으로 안전하지 않은 PRNG
- **위험:** Nonce 예측 공격, 재사용 공격 가능성
- **해결:** `crypto.randomBytes(32).toString('hex')` 사용

#### C-2. 무인증 테스트 엔드포인트 존재
- **위치:** `src/blockchain/blockchain.controller.ts` — `GET /blockchain/approve-user-test`
- **문제:** 인증 없이 접근 가능한 토큰 Approve 실행 엔드포인트
- **위험:** 프로덕션 노출 시 임의 지갑 Approve 실행 가능
- **해결:** 즉시 삭제

---

### HIGH

#### H-1. 이메일 인증 코드 인메모리 저장
- **위치:** `src/mail/mail.service.ts`
- **문제:** `Map<string, VerificationData>` 로 메모리에만 저장
- **위험:** 서버 재시작 시 코드 소멸, 수평 스케일링 불가
- **해결:** Redis 도입 (코드 내 TODO로 언급됨)

#### H-2. NFT 구매와 DB 업데이트 간 원자성 미보장
- **위치:** `src/blockchain/nft.service.ts`
- **문제:** 온체인 트랜잭션 성공 후 DB 업데이트 실패 시 상태 불일치
- **위험:** 온체인 상 sold이나 DB는 미판매 상태 → 중복 판매 가능성
- **해결:** 이벤트 기반 업데이트 + DB 실패 시 재시도/알림 로직 추가

#### H-3. CORS 임시 전체 허용 로직
- **위치:** `src/main.ts`
- **문제:** `FRONTEND_URL` 환경변수 미설정 시 `origin: true` (전체 허용)
- **위험:** 설정 누락 시 모든 오리진에서 API 접근 가능
- **해결:** 환경변수 미설정 시 기동 실패(Validation) 또는 기본값 명시

---

### MEDIUM

#### M-1. 블록체인 입력 DTO 검증 미흡
- **위치:** `src/blockchain/blockchain.controller.ts`
- **문제:** NFT `index`의 범위(0~4) 검증 없음
- **위험:** 유효하지 않은 NFT index로 트랜잭션 시도 → 가스 낭비
- **해결:** `@Min(0) @Max(4) @IsInt()` 데코레이터 추가

#### M-2. WebSocket 재접속 무한 루프 가능
- **위치:** `src/blockchain/nft.service.ts`, `src/blockchain/token.service.ts`
- **문제:** 에러 발생 시 5초 후 무조건 재접속, 최대 횟수 제한 없음
- **해결:** 지수 백오프(Exponential Backoff) + 최대 재시도 횟수 제한

#### M-3. `UserResponseDto.id` 타입 불일치
- **위치:** `src/users/dto/response-users.dto.ts`
- **문제:** `id`가 `number`로 선언되어 있으나 Users 엔티티는 UUID(`string`)
- **해결:** `id: string` 으로 수정

#### M-4. 환경변수 기본값 노출
- **위치:** `src/config/typeorm.ts`
- **문제:** DB 자격증명 미설정 시 `'test'`로 기본값 설정
- **해결:** `@nestjs/config`의 `validationSchema`로 시작 시 필수 검증

#### M-5. 사용자 전체 조회 페이지네이션 없음
- **위치:** `src/users/users.service.ts`
- **문제:** `getAllUsers()`가 모든 레코드를 한 번에 반환
- **해결:** `page`, `limit` 파라미터 추가

---

### LOW

#### L-1. NFT 가격·수량 하드코딩
- **위치:** `src/blockchain/nft.service.ts`
- **문제:** NFT 가격 `'20'`, 인벤토리 수 `5` 코드 내 하드코딩
- **해결:** 환경변수 또는 DB 설정으로 이동

#### L-2. 빈 Users 컨트롤러
- **위치:** `src/users/users.controller.ts`
- **문제:** 컨트롤러는 존재하나 엔드포인트가 없음
- **해결:** 필요한 엔드포인트 추가 또는 파일 제거

#### L-3. API 문서 없음
- Swagger/OpenAPI 설정이 없어 엔드포인트 파악이 코드 리딩에만 의존
- **해결:** `@nestjs/swagger` 추가

---

## 7. 기능 구현 현황

| 기능 | 상태 | 비고 |
|------|------|------|
| Web3 지갑 회원가입/로그인 | ✅ 완료 | 서명 검증 기반 |
| JWT 발급 (Access/Refresh) | ✅ 완료 | |
| 이메일 인증 (한성대) | ✅ 완료 | 인메모리 저장 한계 있음 |
| 역할 기반 접근 제어 (RBAC) | ✅ 완료 | USER / ADMIN |
| ERC-20 토큰 잔액 조회 | ✅ 완료 | |
| 토큰 보상 지급 (관리자) | ✅ 완료 | |
| NFT 인벤토리 조회 | ✅ 완료 | |
| NFT 구매 (서버 가스비 대납) | ✅ 완료 | 원자성 미보장 |
| 블록체인 이벤트 리스너 | ✅ 완료 | 무한 재접속 위험 |
| 입력 유효성 검증 | ⚠️ 부분 | 블록체인 입력 누락 |
| 에러 핸들링 | ⚠️ 부분 | 블록체인 예외 처리 불완전 |
| 테스트 커버리지 | ⚠️ 부분 | 주요 모듈 spec 존재, 블록체인 테스트 없음 |
| API 문서 (Swagger) | ❌ 없음 | |
| Redis 기반 인증 코드 저장 | ❌ 없음 | TODO로 언급만 됨 |

---

## 8. 우선순위별 개선 목록

### 즉시 조치

1. `GET /blockchain/approve-user-test` 엔드포인트 삭제 (C-2)
2. Nonce 생성을 `crypto.randomBytes(32).toString('hex')` 로 교체 (C-1)
3. `UserResponseDto.id` 타입 `string`으로 수정 (M-3)

### 프로덕션 전 필수

4. Redis 기반 이메일 인증 코드 저장 구현 (H-1)
5. CORS 전체 허용 로직 제거 → 환경변수 필수 검증 (H-3)
6. NFT 블록체인 입력 DTO에 `@Min(0) @Max(4)` 추가 (M-1)
7. 환경변수 시작 시 필수 검증 (`ConfigModule.forRoot({ validationSchema })`) (M-4)

### 품질 개선

8. WebSocket 재접속 지수 백오프 적용 (M-2)
9. NFT 구매 DB 업데이트 실패 재시도 로직 (H-2)
10. Swagger 문서 추가 (L-3)
11. `getAllUsers()` 페이지네이션 (M-5)
