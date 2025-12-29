import torch
from faster_whisper import WhisperModel

def get_whisper_config():
    if torch.cuda.is_available():
        return {
            "device": "cuda",
            "compute_type": "float16",
            "model_size": "medium"
        }
    return {
        "device": "cpu",
        "compute_type": "int8",
        "model_size": "base"
    }

config = get_whisper_config()

print(
    f"🔥 Whisper | Device={config['device']} "
    f"Model={config['model_size']} "
    f"Compute={config['compute_type']}"
)

model = WhisperModel(
    config["model_size"],
    device=config["device"],
    compute_type=config["compute_type"]
)

def transcribe_segments(file_path: str):
    segments, _ = model.transcribe(
        file_path,
        vad_filter=True
    )
    return segments
