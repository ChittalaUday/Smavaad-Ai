"""
WebSocket endpoint for real-time audio transcription using faster-whisper.
Accepts binary audio chunks, buffers them, and returns transcribed text.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.transcription_service import TranscriptionService
import tempfile
import os
import uuid
import logging
import json
import time
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)

# Reuse the singleton transcription service
_transcription_service = None

def get_transcription_service():
    global _transcription_service
    if _transcription_service is None:
        _transcription_service = TranscriptionService(model_size="base")
    return _transcription_service


@router.websocket("/ws/transcribe-stream")
async def transcribe_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio transcription.
    
    Client sends binary audio chunks (WebM/Opus from MediaRecorder).
    Server accumulates audio, transcribes periodically, and sends back text.
    """
    await websocket.accept()
    logger.info("WebSocket transcription stream connected")

    audio_buffer = bytearray()
    chunk_count = 0
    temp_dir = "temp_audio"
    os.makedirs(temp_dir, exist_ok=True)

    try:
        service = get_transcription_service()

        while True:
            # Receive binary audio data
            data = await websocket.receive_bytes()
            audio_buffer.extend(data)
            chunk_count += 1

            # Transcribe every 3 chunks (~3 seconds of audio)
            if chunk_count >= 3:
                temp_path = os.path.join(temp_dir, f"stream_{uuid.uuid4()}.webm")
                try:
                    # Write accumulated audio to temp file
                    with open(temp_path, "wb") as f:
                        f.write(bytes(audio_buffer))

                    # Run transcription in a thread to avoid blocking
                    loop = asyncio.get_event_loop()
                    result = await loop.run_in_executor(
                        None,
                        _transcribe_chunk,
                        service,
                        temp_path,
                    )

                    if result and result.strip():
                        await websocket.send_json({
                            "text": result.strip(),
                            "timestamp": time.time(),
                            "type": "transcript",
                        })

                except Exception as e:
                    logger.error(f"Transcription error: {e}")
                    await websocket.send_json({
                        "error": str(e),
                        "type": "error",
                    })
                finally:
                    # Cleanup temp file
                    if os.path.exists(temp_path):
                        try:
                            os.remove(temp_path)
                        except:
                            pass

                # Reset buffer for next batch
                audio_buffer = bytearray()
                chunk_count = 0

    except WebSocketDisconnect:
        logger.info("WebSocket transcription stream disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Cleanup any remaining temp files
        audio_buffer.clear()


def _transcribe_chunk(service: TranscriptionService, audio_path: str) -> str:
    """
    Transcribe a single audio chunk file using faster-whisper directly.
    Returns the transcribed text.
    """
    try:
        from pydub import AudioSegment
        import numpy as np

        audio = AudioSegment.from_file(audio_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio_array = np.array(audio.get_array_of_samples()).astype(np.float32) / 32768.0

        if len(audio_array) < 1600:  # Less than 0.1s of audio
            return ""

        segments, _ = service.model.transcribe(audio_array)
        text = "".join(s.text for s in segments)
        return text.strip()
    except Exception as e:
        logger.error(f"Chunk transcription error: {e}")
        return ""
