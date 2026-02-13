from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import ollama
from fastapi.responses import StreamingResponse
import json

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "deepseek-r1:7b"

@router.post("/chat", tags=["AI Services"])
async def chat(request: ChatRequest):
    """
    Chat with the AI model using Ollama.
    Supports streaming response.
    """
    try:
        # Prepare messages for Ollama
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Enforce last 20 messages context window (if not handled by client, we enforce it here too)
        if len(messages) > 20:
            messages = messages[-20:]

        def stream_generator():
            stream = ollama.chat(
                model=request.model,
                messages=messages,
                stream=True
            )
            for chunk in stream:
                if 'message' in chunk and 'content' in chunk['message']:
                     # Yield the content directly or as a JSON string
                     # Using JSON string to be safer with structure
                     yield json.dumps({"content": chunk['message']['content']}) + "\n"

        return StreamingResponse(stream_generator(), media_type="application/x-ndjson")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
