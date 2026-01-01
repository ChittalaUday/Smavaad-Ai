import os
from faster_whisper import WhisperModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TranslateService:
    def __init__(self, model_size="base", device="cpu", compute_type="int8"):
        """
        Initialize the Whisper model.
        
        Args:
            model_size (str): Size of the Whisper model (e.g., "tiny", "base", "small", "medium", "large-v3").
            device (str): Device to run the model on ("cpu" or "cuda").
            compute_type (str): Compute type ("int8", "float16", "float32").
        """
        logger.info(f"Loading Whisper model: {model_size} on {device} with {compute_type}")
        try:
            self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
            logger.info("Whisper model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise

    def translate(self, audio_path: str, beam_size: int = 5) -> str:
        """
        Translate audio to English text.

        Args:
            audio_path (str): Path to the audio file.
            beam_size (int): Beam size for decoding.

        Returns:
            str: Translated text.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        logger.info(f"Starting translation for: {audio_path}")
        try:
            # task="translate" forces translation to English
            segments, info = self.model.transcribe(
                audio_path, 
                beam_size=beam_size, 
                task="translate"
            )
            
            logger.info(f"Detected language '{info.language}' with probability {info.language_probability}")

            translated_text = []
            for segment in segments:
                translated_text.append(segment.text)

            return " ".join(translated_text).strip()

        except Exception as e:
            logger.error(f"Error during translation: {e}")
            raise
