import json
import os
from app.constants.config import settings
from app.core.dependencies import get_rag_service, get_vector_db
from app.schemas.info_data import InfoDataType
from app.schemas.vector import VectorPoint

rag = get_rag_service()
vdb = get_vector_db()


def run_initial_seeding():
    file_path = "univ-infos.json"

    # 2. 파일 읽기
    if not os.path.exists(file_path):
        print(f"❌ {file_path} 파일이 없습니다!")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        raw_dicts = json.load(f)
        data_list = [InfoDataType(**item) for item in raw_dicts]

    print(f"🚀 총 {len(data_list)}개의 초기 데이터를 시딩합니다...")

    texts = [f"{data.title}: {data.content}" for data in data_list]

    try:
        all_vectors = rag.get_embedding(texts)

        upload_points = []
        for idx, data in enumerate(data_list):

            upload_points.append(
                VectorPoint(id=data.id, vector=all_vectors[idx], payload=data)
            )

        vdb.upsert_data(upload_points)
        print(f"✨ 초기 시딩 완료! (총 {len(data_list)}건)")

    except Exception as e:
        print(f"❌ 시딩 중 에러 발생: {e}")


run_initial_seeding()
