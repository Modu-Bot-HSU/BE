import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # 프로젝트 정보
    PROJECT_NAME: str = "HSU Chatbot AI"
    VERSION: str = "1.0.0"

    # 서버 설정
    FAST_API_PORT: int = int(os.getenv("FAST_API_PORT", 8000))
    FAST_API_HOST: str = os.getenv("FAST_API_HOST", "0.0.0.0")

    # AI 모델 설정
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    GEMINI_ANSWER_MODEL: str = os.getenv("GEMINI_ANSWER_MODEL", "gemini-2.5-flash")
    GEMINI_REFINE_MODEL: str = os.getenv("GEMINI_REFINE_MODEL", "gemini-2.5-flash-lite")
    GEMINI_EMBEDDING_MODEL: str = os.getenv(
        "GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"
    )

    # Qdrant(벡터 DB)
    QDRANT_PORT: str = os.getenv("QDRANT_PORT", 6333)
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    COLLECTION_NAME: str = "hsu_infos"


settings = Settings()
