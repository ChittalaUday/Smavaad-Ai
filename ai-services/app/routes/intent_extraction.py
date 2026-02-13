"""
Intent extraction endpoint — extracts action items, deadlines, and decisions
from call transcript text using Ollama (LLM).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import ollama
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are an AI assistant analyzing a call transcript. Extract the following from the text:

1. **Action Items**: Tasks that need to be done, with the responsible person if mentioned.
2. **Deadlines**: Any dates or timeframes mentioned for tasks.
3. **Decisions**: Key decisions that were made during the conversation.

Return your response as a valid JSON object with this exact structure (no markdown, no extra text):
{
  "action_items": [{"task": "...", "owner": "...", "deadline": "..."}],
  "deadlines": [{"description": "...", "date": "..."}],
  "decisions": [{"description": "...", "context": "..."}]
}

If no items are found for a category, return an empty array for that category.

Transcript:
"""


class IntentRequest(BaseModel):
    transcript: str
    model: str = "deepseek-r1:7b"


class ActionItem(BaseModel):
    task: str
    owner: Optional[str] = None
    deadline: Optional[str] = None


class Deadline(BaseModel):
    description: str
    date: Optional[str] = None


class Decision(BaseModel):
    description: str
    context: Optional[str] = None


class IntentResponse(BaseModel):
    action_items: List[ActionItem] = []
    deadlines: List[Deadline] = []
    decisions: List[Decision] = []


@router.post("/extract-intents", tags=["AI Services"], response_model=IntentResponse)
async def extract_intents(request: IntentRequest):
    """
    Extract action items, deadlines, and decisions from call transcript text.
    Uses Ollama LLM for structured extraction.
    """
    if not request.transcript or len(request.transcript.strip()) < 20:
        return IntentResponse()

    try:
        prompt = EXTRACTION_PROMPT + request.transcript

        response = ollama.chat(
            model=request.model,
            messages=[{"role": "user", "content": prompt}],
        )

        raw_content = response["message"]["content"]

        # Strip <think> tags if present (deepseek-r1 specific)
        import re
        raw_content = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL)

        # Try to extract JSON from the response
        json_match = re.search(r"\{[\s\S]*\}", raw_content)
        if json_match:
            parsed = json.loads(json_match.group())
            return IntentResponse(**parsed)

        logger.warning("Could not parse LLM response as JSON")
        return IntentResponse()

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error in intent extraction: {e}")
        return IntentResponse()
    except Exception as e:
        logger.error(f"Intent extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
