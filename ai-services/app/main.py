from fastapi import FastAPI
from app.routes.transcribe import router as transcribe_router
from app.routes.translate import router as translate_router
from app.routes.diarize_transcribe import router as diarize_transcribe_router
from app.routes.chat import router as chat_router
from app.routes.transcribe_stream import router as transcribe_stream_router
from app.routes.intent_extraction import router as intent_extraction_router
from app.routes.call_summary import router as call_summary_router

from dotenv import load_dotenv
import os

load_dotenv()  # loads .env into environment

app = FastAPI(
    title="SAMVAAD-AI Speech Service",
    version="1.0"
)
app.include_router(transcribe_router, prefix="/api")
app.include_router(translate_router, prefix="/api")
app.include_router(diarize_transcribe_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(transcribe_stream_router, prefix="/api")
app.include_router(intent_extraction_router, prefix="/api")
app.include_router(call_summary_router, prefix="/api")

@app.get("/")
def health():
    return {"status": "running"}
