# SAMVAAD AI - AI Services

This service provides speech-to-text transcription, translation, and speaker diarization capabilities using `faster-whisper` and `pyannote.audio`.

## Automated Meeting Transcription

The frontend application (`client`) is configured to **automatically record** video calls. 
*   **Start**: Recording starts when a user initiates a call or answers an incoming call.
*   **Processing**: The audio (local + remote mix) is captured in the browser.
*   **End**: When the call is hung up, the captured audio is automatically sent to the backend.
*   **Result**: The backend forwards the audio to this AI service, generates a diarized transcript, and the PDF is automatically downloaded in the browser as `meeting-transcript.pdf`.

## Prerequisites

*   **Python 3.10+** (Python 3.10 is recommended for stability with `pyannote.audio` and `torch`).
*   **FFmpeg**: Required for audio processing. Ensure `ffmpeg` is installed and added to your system's PATH.
    *   *Windows*: `winget install "FFmpeg (Essentials)"` or download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) and add `bin` to PATH.
    *   *Linux*: `sudo apt install ffmpeg`
    *   *MacOS*: `brew install ffmpeg`

## Installation

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd ai-services
    ```

2.  **Create a Virtual Environment**:
    It is highly recommended to use a clean virtual environment to avoid dependency conflicts.
    ```bash
    # Windows
    py -3.10 -m venv venv_new
    .\venv_new\Scripts\activate

    # Linux/Mac
    python3.10 -m venv venv_new
    source venv_new/bin/activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

1.  **Hugging Face Token**:
    You need a Hugging Face token to use the diarization model (`pyannote/speaker-diarization-3.1`).
    *   Accept the user conditions on [pyannote/speaker-diarization-3.1](https://huggingface.co/pyannote/speaker-diarization-3.1).
    *   Accept the user conditions on [pyannote/segmentation-3.0](https://huggingface.co/pyannote/segmentation-3.0).
    
    Create a `.env` file in the root `ai-services` directory:
    ```bash
    HUGGING_FACE_TOKEN=hf_your_token_here
    ```

## Running the Server

Start the FastAPI server using `uvicorn`:

```bash
# Ensure your venv is activated
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at `http://127.0.0.1:8000`.
API Documentation (Swagger UI) is available at `http://127.0.0.1:8000/docs`.

## Testing

You can use the included test suite to verify the installation:

```bash
# Make sure the server is running in a separate terminal
python test_suite.py
```

This script will iterate through audio files in the `test-files/` directory, send them to the API, and print the resulting segments.

## Troubleshooting

*   **RuntimeError: failed to load ffmpeg**: Ensure FFmpeg is installed and accessible in your command prompt.
*   **AttributeError: 'DiarizeOutput' object has no attribute 'itertracks'**: This issue has been patched in the service code. Ensure you are using the latest version of `app/services/diarization_service.py`.
*   **UnicodeDecodeError in .env**: Ensure your `.env` file is saved with UTF-8 encoding. Powershell sometimes creates UTF-16 files by default.
