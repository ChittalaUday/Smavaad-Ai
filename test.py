from pyannote.audio import Pipeline

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-community-1",
    token="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"
)

audio_path = r"D:\Projects\Git clone Projects\SAMVAAD AI\ai-services\test-files\12-25-2025 22.09.m4a"
output = pipeline(audio_path)

for turn, _, speaker in output.itertracks(yield_label=True):
    print(f"{speaker} speaks from {turn.start:.2f}s to {turn.end:.2f}s")
