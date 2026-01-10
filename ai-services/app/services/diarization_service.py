import os
import logging
import torch
from pyannote.audio import Pipeline
from pydub import AudioSegment
import numpy as np
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

hf_token = os.getenv("HUGGING_FACE_TOKEN")

class DiarizationService:
    def __init__(self):
        """
        Initialize the Diarization pipeline using pyannote.audio.
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device} for diarization")

        # It's recommended to use an environment variable for the token
        hf_token = os.getenv("HUGGING_FACE_TOKEN")
        if not hf_token:
            raise ValueError("Hugging Face token not found. Please set the HUGGING_FACE_TOKEN environment variable.")

        try:
            # Load the pretrained model from pyannote.audio (HuggingFace Hub)
            self.pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                token=hf_token
            ).to(self.device)
            logger.info("pyannote.audio speaker-diarization pipeline loaded successfully.")

        except Exception as e:
            logger.error(f"Failed to load pyannote.audio pipeline: {e}")
            raise

    def diarize(self, audio_path: str):
        """
        Perform speaker diarization on an audio file.
        
        Args:
            audio_path (str): Path to the audio file.

        Returns:
            A list of speaker segments with start time, end time, and speaker label.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        logger.info(f"Starting diarization for: {audio_path}")
        
        temp_wav_path = None
        try:
            # Load audio with pydub
            audio = AudioSegment.from_file(audio_path)
            # pyannote expects 16kHz mono
            audio = audio.set_frame_rate(16000).set_channels(1)
            
            # Convert to numpy array and then to torch tensor
            # pydub audio is int16 (usually), normalize to float between -1 and 1
            data = np.array(audio.get_array_of_samples())
            
            # Create a temporary file for the converted audio
            # temp_wav_path = "temp_diarization_audio.wav"
            # audio.export(temp_wav_path, format="wav")

            # Convert to float32 and normalize
            if audio.sample_width == 2:
                data = data.astype(np.float32) / 32768.0
            elif audio.sample_width == 4:
                data = data.astype(np.float32) / 2147483648.0
            
            # Create torch tensor of shape (channels, time) -> (1, time)
            waveform = torch.from_numpy(data).unsqueeze(0)
            
            # Pass dictionary to pipeline
            input_tensor = {"waveform": waveform, "sample_rate": 16000}

            # Perform diarization
            output = self.pipeline(input_tensor)
            diarization = output.speaker_diarization

            # Process the output
            segments = []
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                segments.append({
                    "start": turn.start,
                    "end": turn.end,
                    "speaker": speaker
                })

            logger.info("Diarization completed.")
            return segments

        except Exception as e:
            logger.error(f"Error during diarization: {e}")
            with open("diarization_error.log", "a") as f:
                f.write(f"Error: {e}\n")
                import traceback
                f.write(traceback.format_exc())
                f.write("\n")
            raise
        finally:
            # Clean up the temporary file
            if temp_wav_path and os.path.exists(temp_wav_path):
                os.remove(temp_wav_path)