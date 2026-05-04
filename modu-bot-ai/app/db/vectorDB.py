from app.constants.config import settings
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.schemas.knowledge_data import KnowledgeDataType
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
            with_payload=True,
        ).points

    def delete_point(self, point_id: str):
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=models.PointIdsList(points=[point_id]),
        )

    # 무한 스크롤을 위한 카테고리별/전체 데이터 조회
    def get_knowledges_scroll(
        self, category: str | None = None, limit: int = 50, offset: str | int | None = None
    ):
        # 1. 필터 정의 (category 없으면 전체 조회)
        search_filter = (
            models.Filter(
                must=[
                    models.FieldCondition(
                        key="category",
                        match=models.MatchValue(value=category),
                    )
                ]
            )
            if category
            else None
        )

        # 2. 전체 개수 조회 (count API 사용)
        count_result = self.client.count(
            collection_name=self.collection_name,
            count_filter=search_filter,
            exact=True,  # 정확한 개수를 위해 True 설정
        )

        # 3. 데이터 스크롤 조회
        records, next_offset = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=search_filter,
            limit=limit,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )

        knowledges = []
        for record in records:
            item = dict(record.payload)
            item["id"] = record.id
            knowledges.append(item)

        return {
            "total_count": count_result.count,  # 전체 개수 추가
            "knowledges": knowledges,
            "next_offset": next_offset,
        }
