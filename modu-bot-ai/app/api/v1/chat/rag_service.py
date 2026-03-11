from google import genai
from app.constants.config import settings
from app.core.dependencies import get_vector_db
from app.constants.prompt import RAG_ANSWER_PROMPT_TEMPLATE


class RAGService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.answer_model = settings.GEMINI_ANSWER_MODEL
        self.embedding_model = settings.GEMINI_EMBEDDING_MODEL
        self.vector_db = get_vector_db()

    # 임베딩
    def get_embedding(self, text_or_list: str | list[str]):
        input_data = [text_or_list] if isinstance(text_or_list, str) else text_or_list

        result = self.client.models.embed_content(
            model=settings.GEMINI_EMBEDDING_MODEL,
            contents=input_data,
            config={"output_dimensionality": 768},
        )

        embeddings = [embedding.values for embedding in result.embeddings]

        return embeddings[0] if isinstance(text_or_list, str) else embeddings

    # 답변 생성
    def generate_answer(self, question: str):

        query_vector = self.get_embedding(question)

        search_results = self.vector_db.search_similar(query_vector, limit=3)

        context_text = "\n".join(
            [res.payload.get("content", "") for res in search_results]
        )

        prompt = RAG_ANSWER_PROMPT_TEMPLATE.format(
            context=context_text, question=question
        )

        response = self.client.models.generate_content(
            model=self.answer_model, contents=prompt
        )

        return response.text


rag_service = RAGService()
