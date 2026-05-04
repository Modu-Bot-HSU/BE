# Modu-Bot AI Server Task & Code Generation Guide

## 0. 작업 지침 (CRITICAL RULES)

- **즉시 파일 수정 금지:** 이 문서를 읽고 나서 로컬 환경의 실제 파일을 즉시 수정(write)하거나 덮어쓰지 마세요.
- **코드 선공개 요구사항:** 실제 파일을 수정하기 전에, **어떤 메서드를 어떻게 수정할 것인지에 대한 계획**과 **실제 작성할 Python 코드 스니펫 전체**를 MODUBOT-AI-REF.md로 저장하세요.
- **책임 분리 원칙:** 이 프로젝트는 FastAPI 기반의 AI/Vector DB 마이크로서비스입니다. 사용자 인증, 토큰 발급, 관리자 승인 상태 관리 등 NestJS 서버가 담당해야 할 비즈니스 로직은 절대 침범하지 마세요.

## 1. 구현 및 수정 명세

### A. RAG 답변에 출처(Metadata) 포함

- **대상:** `RAGService.generate_answer`
- **요구사항:** AI가 생성한 텍스트만 반환하던 기존 로직을 수정하세요. `search_results`에서 추출한 원본 문서들의 메타데이터(출처, 카테고리, 문서 ID 등)를 포함하여 딕셔너리(Dict) 형태로 반환해야 합니다.

### B. 벡터 업데이트 로직 최적화

- **대상:** `RAGService.update_info_logic`
- **요구사항:** 기존 `payload`를 유지하면서도, 새로 정제된(요약된) 데이터만 정확하게 다시 임베딩하여 Qdrant에 upsert 하도록 로직을 다듬으세요.

### C. 신규 기능: 대기 데이터 AI 요약

- **추가 대상:** `RAGService.summarize_pending_info(self, raw_content: str)`
- **요구사항:** `self.refine_model`을 사용하여 사용자의 원본 데이터(`raw_content`)에서 핵심 내용만 요약하여 반환하는 로직을 작성하세요.

### D. 신규 기능: 벡터 데이터 삭제

- **추가 대상:** `RAGService.delete_vector_info(self, info_id: str)`
- **요구사항:** 전달받은 `info_id`와 일치하는 벡터 데이터를 Qdrant 데이터베이스에서 완전히 삭제하는 로직을 작성하세요.

## 2. Claude Code 행동 강령

1. 현재 프로젝트의 `app/services/rag_service.py` 구조를 파악하세요.
2. 위 명세(A~D)를 완벽히 충족하는 코드를 설계하세요.
3. 터미널에 각 기능별로 변경/추가되는 **명시적인 코드 블록(`python ... `)**을 출력하세요.
