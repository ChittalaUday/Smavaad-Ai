import os
import shutil
from fastapi import APIRouter, UploadFile, File
from app.services.whisper_service import transcribe_segments
from app.services.diarization_service import diarize_audio

router = APIRouter()

UPLOAD_DIR = "temp_audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def normalize_speakers(results):
    speaker_map = {}
    count = 1

    for r in results:
        if r["speaker"] not in speaker_map:
            speaker_map[r["speaker"]] = f"Speaker {count}"
            count += 1
        r["speaker"] = speaker_map[r["speaker"]]

    return results

@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    file_path = f"{UPLOAD_DIR}/{file.filename}"

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    whisper_segments = transcribe_segments(file_path)
    diarization = diarize_audio(file_path)

    results = []

    for seg in whisper_segments:
        speaker = "Unknown"
        for d in diarization:
            if seg.start >= d["start"] and seg.end <= d["end"]:
                speaker = d["speaker"]
                break

        results.append({
            "speaker": speaker,
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip()
        })

    os.remove(file_path)

    return {
        "success": True,
        "segments": normalize_speakers(results)
    }
