import requests
import os

# Configuration
API_URL = "http://localhost:8000/api/translate"
AUDIO_FILE = "d:\\Projects\\Git clone Projects\\SAMVAAD AI\\ai-services\\test-files\\12-25-2025 22.09.m4a"

def test_translate():
    if not os.path.exists(AUDIO_FILE):
        print(f"Error: Audio file not found at {AUDIO_FILE}")
        return

    print(f"Testing translation with file: {AUDIO_FILE}")
    try:
        with open(AUDIO_FILE, "rb") as f:
            files = {"file": f}
            # Using 'tiny' model for faster verification
            data = {"model_size": "tiny", "beam_size": 5}
            response = requests.post(API_URL, files=files, data=data)
        
        if response.status_code == 200:
            print("Success!")
            print("Response:", response.json())
        else:
            print(f"Failed with status code {response.status_code}")
            print("Response:", response.text)

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_translate()
