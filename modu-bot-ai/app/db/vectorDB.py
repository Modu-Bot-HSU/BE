from app.constants.config import settings
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.schemas.info_data import InfoDataType
from app.schemas.vector import VectorPoint


class VectorDB:
    def __init__(self):
        self.host = settings.QDRANT_HOST
        self.port = settings.QDRANT_PORT
        self.collection_name = settings.COLLECTION_NAME

        self.client = QdrantClient(host=self.host, port=self.port)
        self._ensure_collection()

    # Qdrant의 콜렉션을 초기화합니다
    def _ensure_collection(self):
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)

        if not exists:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=768,
                    distance=models.Distance.COSINE,
                ),
            )

    # 데이터를 삽입합니다
    def upsert_data(self, data: VectorPoint | list[VectorPoint]):

        points_input = [data] if isinstance(data, VectorPoint) else data

        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                models.PointStruct(
                    id=vp.id, vector=vp.vector, payload=vp.payload.model_dump()
                )
                for vp in points_input
            ],
        )

    # 유저 질문과 비슷한 상위 N개의 답변을 가져옵니다
    def search_similar(self, query: list, limit: int = 3):
        return self.client.query_points(
            collection_name=self.collection_name,
            query=query,
            limit=limit,
            with_payload=True,  # 텍스트 내용도 같이 가져옴
        ).points

    # 저장된 모든 정보들을 조회합니다
    def get_all_infos(self):
        response, _ = self.client.scroll(
            collection_name=self.collection_name,
            with_payload=True,
            with_vectors=False,
        )
        return [point.payload for point in response]
