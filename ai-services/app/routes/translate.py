from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.services.translate_service import TranslateService
import shutil
import os
import uuid
from typing import Optional

router = APIRouter()

# Initialize service globally or per request
# For strictly local usage, initializing once might be better, but 'base' is small enough.
# Let's use a singleton-like approach or just init here if we want to change models dynamically.
# For now, we will instantiate a default model. 
# In a production app, we might want dependency injection or a global singleton.
translate_service = TranslateService(model_size="base")

TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/translate")
async def translate_audio(
    file: UploadFile = File(...),
    model_size: Optional[str] = Form("base"),
    beam_size: int = Form(5)
):
    """
    Translate uploaded audio file to English.
    """
    # Create a unique filename
    file_extension = os.path.splitext(file.filename)[1]
    temp_filename = f"{uuid.uuid4()}{file_extension}"
    temp_file_path = os.path.join(TEMP_DIR, temp_filename)

    try:
        # Save uploaded file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Perform translation
        # Note: If we wanted to support dynamic model switching, we would need to manage instances.
        # Here we just use the default initialized service.
        text = translate_service.translate(temp_file_path, beam_size=beam_size)
        
        return {
            "source_language_detected": "auto", # The service logs this, we could expose it if needed
            "translation": text,
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
