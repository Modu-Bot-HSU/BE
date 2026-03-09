from google import genai
from app.constants.config import settings


class RAGService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.answer_model = settings.GEMINI_ANSWER_MODEL
        self.embedding_model = settings.GEMINI_EMBEDDING_MODEL

    def get_embedding(self, infos: list[str]):
        result = self.client.models.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL, contents=infos
        )

        return [embedding.values for embedding in result.embeddings]


rag_service = RAGService()
