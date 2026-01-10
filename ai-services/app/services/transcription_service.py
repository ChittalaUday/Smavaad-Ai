import logging
import torch
from faster_whisper import WhisperModel
from pydub import AudioSegment
import numpy as np
from typing import List, Dict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TranscriptionService:
    def __init__(self, model_size="large-v2"):
        """
        Initialize the Transcription service using faster-whisper.
        """
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if self.device == "cuda" else "int8"
        
        logger.info(f"Using device: {self.device} for transcription with compute_type: {compute_type}")

        try:
            # Using a smaller model for faster performance on CPU, change to "large-v2" if more accuracy is needed
            self.model = WhisperModel(model_size if self.device == "cuda" else "base", device=self.device, compute_type=compute_type)
            logger.info(f"faster-whisper model '{model_size if self.device == 'cuda' else 'base'}' loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load faster-whisper model: {e}")
            raise

    def transcribe(self, audio_path: str, segments: List[Dict]) -> List[Dict]:
        """
        Transcribe audio segments using faster-whisper.
        
        Args:
            audio_path (str): Path to the full audio file.
            segments (List[Dict]): List of segments with 'start', 'end', and 'speaker'.

        Returns:
            List[Dict]: The same segments with an added 'text' field.
        """
        if not segments:
            logger.info("No segments to transcribe.")
            return []

        logger.info(f"Starting transcription for: {audio_path} with {len(segments)} segments")

        try:
            audio = AudioSegment.from_file(audio_path)
            audio = audio.set_frame_rate(16000).set_channels(1)
            audio_array = np.array(audio.get_array_of_samples()).astype(np.float32) / 32768.0

            for i, segment_info in enumerate(segments):
                start_time = segment_info["start"]
                end_time = segment_info["end"]

                start_sample = int(start_time * 16000)
                end_sample = int(end_time * 16000)
                
                segment_audio = audio_array[start_sample:end_sample]

                transcribed_segments, _ = self.model.transcribe(segment_audio)
                
                text = "".join(s.text for s in transcribed_segments)
                
                segments[i]["text"] = text.strip()
            
            logger.info("Transcription completed.")
            return segments

        except Exception as e:
            logger.error(f"Error during transcription: {e}")
            raise
