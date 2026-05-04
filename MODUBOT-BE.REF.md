import os

# Define the content of the markdown file
md_content = """# MODU-BOT-BE 신규 기능 확장 명세서 (Functional Specification)

## 1. 프로젝트 개요
본 문서는 `MODU-BOT` 서비스의 백엔드(BE) 서버에 새로운 지식 관리 및 보상 체계를 도입하기 위한 기능 명세서이다. 기존의 구현된 기능(Legacy)을 수정하지 않고, 새로운 기능을 독립적이고 정합성 있게 추가하는 것을 원칙으로 한다.

## 2. 핵심 요구사항 및 제약사항
- **신규 기능 위주 구현**: 현재 구현되어 있는 기능을 수정하는 것이 아니라, 명시된 신규 기능을 추가하는 데 집중할 것.
- **데이터 무결성**: 모든 지식 생성/수정/삭제 요청은 즉시 반영되지 않으며, 데이터베이스에 '대기(PENDING)' 상태로 저장된 후 관리자의 승인을 거쳐야 한다.
- **외부 서버 연동**: 관리자 승인 시 `modu-bot-ai` 서버의 RAG 서비스와 통신하여 데이터를 동기화한다.
- **보상 체계**: 지식 제공이 최종 승인될 경우, 해당 유저에게 NFT 토큰을 지급하는 로직을 포함한다.
- **ID 규격**: 시스템 내에서 사용되는 `knowledge_id`는 반드시 **UUID v7** 형식을 사용한다.

## 3. 상세 기능 명세

### 3.1 지식 답변 제출 및 대기 시스템
- **목적**: 학교 생활 관련 질문에 대한 답변을 수집하고 검증 후 보상한다.
- **프로세스**:
    1. 유저가 학교 생활 관련 질문/답변 제출.
    2. BE 서버는 해당 데이터를 `Status: PENDING` 상태로 DB에 저장.
    3. 관리자가 해당 건을 조회 후 '승인(APPROVED)' 처리.
    4. 승인 시 `modu-bot-ai` 서버로 데이터를 전송하고, 유저에게 블록체인 기반 NFT 토큰 지급 로직 호출.

### 3.2 RAG 지식 베이스 조회 (Retrieve)
- **목적**: 유저가 현재 서비스에 반영된 RAG 지식 베이스를 조회한다.
- **규격**: `modu-bot-ai`의 RAG 서비스 `GET` 인터페이스 규격과 100% 일치해야 함.
- **필요 필드**: `knowledge_id` (UUID v7), `content`, `category`, `created_at` 등.

### 3.3 지식 베이스 수정 요청 (Update Request)
- **목적**: 기존 지식에 대한 수정 제안을 수집한다.
- **규격**: `modu-bot-ai`의 RAG 서비스 `UPDATE` 인터페이스 규격과 일치하게 설계.
- **프로세스**:
    1. 유저가 특정 `knowledge_id`에 대한 수정 내용 제출.
    2. BE 서버는 수정 요청 내용을 별도의 `PendingRequest` 테이블 혹은 상태 필드로 저장.
    3. 관리자 승인 전까지는 원본 데이터가 유지됨.
    4. 관리자 승인 시 `modu-bot-ai` 서버에 업데이트 요청 전송 및 DB 반영.

### 3.4 지식 베이스 삭제 요청 (Delete Request)
- **목적**: 잘못된 정보나 불필요한 지식의 삭제를 요청한다.
- **규격**: `modu-bot-ai`의 RAG 서비스 `DELETE` 인터페이스 규격과 일치하게 설계.
- **프로세스**:
    1. 유저가 삭제 대상 `knowledge_id`와 사유 제출.
    2. `Status: DELETE_PENDING` 등의 상태로 관리자 대기열에 진입.
    3. 관리자 승인 시 `modu-bot-ai` 서버에서 해당 벡터 데이터 삭제 요청 후 BE DB에서 처리.

## 4. 기술적 세부 사항
- **Database**: 지식 상태 관리를 위한 필드(예: `status`, `submitted_by`, `approved_at`) 추가 필요.
- **Internal API Call**: `modu-bot-ai` 서버와의 통신 시 에러 핸들링 필수 (Timeout, Retry logic 등).
- **ID Generation**: `knowledge_id` 생성 시 타임스탬프 기반의 정렬이 가능한 UUID v7을 생성하는 라이브러리 활용.

## 5. 관리자 워크플로우 (참고용)
1. **Pending 리스트 확인**: `GET /admin/pending-requests`
2. **승인 처리**: `POST /admin/approve/:requestId`
   - 내부 로직: `modu-bot-ai` 전송 -> 성공 시 DB 상태 변경 -> NFT 지급 API 호출.
3. **반려 처리**: `POST /admin/reject/:requestId`
   - 사유 기록 및 상태 변경 (`REJECTED`).
"""