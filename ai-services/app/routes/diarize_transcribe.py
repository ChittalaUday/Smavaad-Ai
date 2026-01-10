import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import logging

from app.services.diarization_service import DiarizationService
from app.services.transcription_service import TranscriptionService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Service Instantiation
# For a production application, consider a more robust way to manage service lifecycle,
# like FastAPI's dependency injection system.
try:
    diarization_service = DiarizationService()
    transcription_service = TranscriptionService()
except Exception as e:
    logger.error(f"Failed to initialize services: {e}")
    # This will prevent the app from starting if models fail to load, which is good.
    raise

@router.post("/diarize-transcribe", tags=["AI Services"])
async def diarize_transcribe_audio(file: UploadFile = File(...)):
    """
    Accepts an audio file, performs speaker diarization, and then transcribes
    the speech for each speaker segment.
    """
    
    # Create a temporary path to store the uploaded file
    temp_dir = "temp_audio"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)

    try:
        # Save the uploaded file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File '{file.filename}' saved to '{temp_file_path}'")

        # 1. Perform Diarization
        logger.info("Starting diarization process...")
        diarized_segments = diarization_service.diarize(temp_file_path)

        if not diarized_segments:
            return {
                "message": "Diarization complete, but no speaker segments were identified.",
                "segments": []
            }

        # 2. Perform Transcription on diarized segments
        logger.info("Starting transcription process...")
        final_segments = transcription_service.transcribe(temp_file_path, diarized_segments)

        return {
            "message": "Diarization and transcription completed successfully.",
            "segments": final_segments
        }

    except FileNotFoundError as e:
        logger.error(f"File not found error: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            logger.info(f"Temporary file '{temp_file_path}' removed.")
