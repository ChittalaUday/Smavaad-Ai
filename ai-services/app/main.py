from fastapi import FastAPI
# from app.routes.transcribe import router as transcribe_router
from app.routes.translate import router as translate_router

from dotenv import load_dotenv
import os

load_dotenv()  # loads .env into environment

app = FastAPI(
    title="SAMVAAD-AI Speech Service",
    version="1.0"
)
# app.include_router(transcribe_router, prefix="/api")
app.include_router(translate_router, prefix="/api")

@app.get("/")
def health():
    return {"status": "running"}
