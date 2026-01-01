import os
import torch
from pyannote.audio import Pipeline


def diarize_audio(file_path: str):
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        token="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"
    )

    diarization = pipeline(file_path)

    speakers = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        speakers.append({
            "speaker": speaker,
            "start": float(turn.start),
            "end": float(turn.end)
        })

    return speakers
