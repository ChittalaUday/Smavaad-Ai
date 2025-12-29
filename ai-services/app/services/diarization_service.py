import os
import torch
from pyannote.audio import Pipeline

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

_pipeline = None

def get_pipeline():
    global _pipeline

    if _pipeline is None:
        hf_token = os.getenv("HF_TOKEN")
        if not hf_token:
            raise RuntimeError("HF_TOKEN not set")

        _pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            token="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"
        )

        _pipeline.to(DEVICE)

    return _pipeline


def diarize_audio(file_path: str):
    pipeline = get_pipeline()

    diarization = pipeline(file_path)

    speakers = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        speakers.append({
            "speaker": speaker,
            "start": float(turn.start),
            "end": float(turn.end)
        })

    return speakers
