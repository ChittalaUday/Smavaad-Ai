import requests
import os
import json

# Configuration
API_URL = "http://localhost:8000/api/transcribe"
# Using the same test file as translate verification
AUDIO_FILE = "d:\\Projects\\Git clone Projects\\SAMVAAD AI\\ai-services\\test-files\\12-25-2025 22.09.m4a"

def test_transcribe():
    if not os.path.exists(AUDIO_FILE):
        print(f"Error: Audio file not found at {AUDIO_FILE}")
        return

    print(f"Testing transcription/diarization with file: {AUDIO_FILE}")
    try:
        with open(AUDIO_FILE, "rb") as f:
            files = {"file": f}
            # Using 'tiny' model for faster verification, and a small beam size
            data = {"model_size": "tiny", "beam_size": 2}
            print("Sending request to API...")
            response = requests.post(API_URL, files=files, data=data)
        
        if response.status_code == 200:
            print("Success!")
            result = response.json()
            # print("Full Response:", json.dumps(result, indent=2))
            
            print("\n--- Speaker Segments ---")
            for segment in result.get("segments", []):
                start = segment['start']
                end = segment['end']
                speaker = segment['speaker']
                text = segment['text']
                print(f"[{start:.2f}s - {end:.2f}s] {speaker}: {text}")
                
        else:
            print(f"Failed with status code {response.status_code}")
            print("Response:", response.text)

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_transcribe()
