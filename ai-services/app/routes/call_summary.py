"""
Call summarization endpoint — generates a concise summary and action item list
from a full call transcript using Ollama (LLM).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import ollama
import json
import re
import logging
import base64
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

router = APIRouter()
logger = logging.getLogger(__name__)

SUMMARY_PROMPT = """You are an AI assistant that creates professional call summaries. 
Given the following call transcript, produce:

1. A **concise summary** of the key discussion points (2-4 paragraphs max).
2. A **checklist of action items** with assigned owners and deadlines (if mentioned).

Return your response as a valid JSON object with this exact structure (no markdown, no extra text):
{
  "summary": "Concise summary text here...",
  "action_items": [
    {"task": "...", "owner": "...", "deadline": "..."}
  ],
  "key_topics": ["topic1", "topic2"]
}

If no action items were identified, return an empty array.

Transcript:
"""


class SummaryRequest(BaseModel):
    transcript: str
    intents: Optional[List[dict]] = None
    model: str = "deepseek-r1:7b"


class ActionItemOut(BaseModel):
    task: str
    owner: Optional[str] = None
    deadline: Optional[str] = None


class SummaryResponse(BaseModel):
    summary: str = ""
    action_items: List[ActionItemOut] = []
    key_topics: List[str] = []
    pdf_report: Optional[str] = None  # Base64 encoded PDF


def generate_summary_pdf(data: dict) -> str:
    """
    Generates a PDF report from the summary data and returns it as a base64 string.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#4f46e5'),
        spaceAfter=20,
        alignment=1  # Center
    )
    story.append(Paragraph("SAMVAAD AI - Meeting Summary", title_style))
    story.append(Spacer(1, 12))

    # Summary Section
    story.append(Paragraph("Summary", styles['Heading2']))
    story.append(Paragraph(data.get('summary', 'No summary provided.'), styles['BodyText']))
    story.append(Spacer(1, 12))

    # Key Topics
    if data.get('key_topics'):
        story.append(Paragraph("Key Topics", styles['Heading2']))
        topics_text = ", ".join(data['key_topics'])
        story.append(Paragraph(topics_text, styles['BodyText']))
        story.append(Spacer(1, 12))

    # Action Items Section
    if data.get('action_items'):
        story.append(Paragraph("Action Items", styles['Heading2']))
        
        # Create table for action items
        table_data = [["Task", "Owner", "Deadline"]]
        for item in data['action_items']:
            table_data.append([
                item.get('task', ''),
                item.get('owner', 'N/A'),
                item.get('deadline', 'N/A')
            ])
        
        t = Table(table_data, colWidths=[300, 100, 100])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4f46e5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(t)
    
    doc.build(story)
    
    buffer.seek(0)
    pdf_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    buffer.close()
    return pdf_base64


@router.post("/call-summarize", tags=["AI Services"], response_model=SummaryResponse)
async def summarize_call(request: SummaryRequest):
    """
    Generate a concise summary and action item list from a full call transcript.
    """
    if not request.transcript or len(request.transcript.strip()) < 20:
        return SummaryResponse(summary="Call was too short to summarize.")

    try:
        prompt = SUMMARY_PROMPT + request.transcript

        # If intents were provided, add them as context
        if request.intents:
            prompt += f"\n\nPreviously extracted intents for reference:\n{json.dumps(request.intents, indent=2)}"

        response = ollama.chat(
            model=request.model,
            messages=[{"role": "user", "content": prompt}],
        )

        raw_content = response["message"]["content"]

        # Strip <think> tags if present (deepseek-r1 specific)
        raw_content = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL)

        # Try to extract JSON from the response
        json_match = re.search(r"\{[\s\S]*\}", raw_content)
        if json_match:
            parsed = json.loads(json_match.group())
            # Generate PDF
            pdf_base64 = generate_summary_pdf(parsed)
            parsed['pdf_report'] = pdf_base64
            return SummaryResponse(**parsed)

        # Fallback: use raw text as summary
        logger.warning("Could not parse LLM response as JSON, using raw text")
        return SummaryResponse(summary=raw_content.strip())

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error in call summary: {e}")
        return SummaryResponse(summary="Failed to parse AI response.")
    except Exception as e:
        logger.error(f"Call summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class PdfRequest(BaseModel):
    summary: str
    action_items: Optional[List[dict]] = None
    key_topics: Optional[List[str]] = None


@router.post("/generate-pdf", response_model=dict)
async def generate_pdf_endpoint(request: PdfRequest):
    """
    Manually generate a PDF report from provided summary data.
    """
    try:
        data = {
            "summary": request.summary,
            "action_items": request.action_items or [],
            "key_topics": request.key_topics or []
        }
        pdf_base64 = generate_summary_pdf(data)
        return {"pdf_report": pdf_base64}
    except Exception as e:
        logger.error(f"Generate PDF error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
