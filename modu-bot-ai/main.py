import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.constants.config import settings
from app.api.v1.chat.rag_controller import router as chat_router
from app.schemas.common import ResponseType, ErrorType

app = FastAPI(title=settings.PROJECT_NAME)
app.include_router(chat_router, prefix="/api/v1", tags=["Chat"])


@app.get("/")
def read_root():
    return {"message": "한성대 챗봇 AI 서버가 작동중입니다"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    response_content = ResponseType(
        success=False,
        data=None,
        error=ErrorType(code="INTERNAL_SERVER_ERROR", message=str(exc)),
    )

    return JSONResponse(status_code=500, content=response_content.model_dump())


if __name__ == "__main__":

    print(f"server is running on {settings.FAST_API_PORT}")

    uvicorn.run(
        "main:app",
        host=settings.FAST_API_HOST,
        port=settings.FAST_API_PORT,
        reload=True,
    )
