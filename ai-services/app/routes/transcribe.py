from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.services.transcription_service import TranscriptionService
from app.services.diarization_service import DiarizationService
import shutil
import os
import uuid
from typing import Optional, List, Dict

router = APIRouter()

# Initialize services
# In a real production environment, these should be dependencies or singletons managed by the app state
transcription_service = TranscriptionService()
diarization_service = DiarizationService()

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)



@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    beam_size: int = Form(5)
):
    """
    Transcribe uploaded audio file and perform speaker diarization.
    """
    # Create a unique filename
    file_extension = os.path.splitext(file.filename)[1]
    temp_filename = f"{uuid.uuid4()}{file_extension}"
    temp_file_path = os.path.join(TEMP_DIR, temp_filename)

    try:
        # Save uploaded file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 1. Diarize (Speaker Identification)
        diarized_segments = diarization_service.diarize(temp_file_path)

        if not diarized_segments:
             # Fallback if no speaker detected? Or just transribe whole?
             # For now return empty segments or handle gracefully
             pass

        # 2. Transcribe (Speech to Text) per segment
        final_segments = transcription_service.transcribe(temp_file_path, diarized_segments)
        
        return {
            "status": "success",
            "segments": final_segments
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
