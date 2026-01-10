import requests
import os
import json
import glob

# Configuration
API_URL = "http://localhost:8000/api/transcribe"
TEST_FILES_DIR = "d:\\Projects\\Git clone Projects\\SAMVAAD AI\\ai-services\\test-files"

def test_file(file_path):
    if not os.path.exists(file_path):
        print(f"Error: Audio file not found at {file_path}")
        return

    print(f"\n==========================================")
    print(f"Testing file: {os.path.basename(file_path)}")
    print(f"==========================================")
    
    try:
        with open(file_path, "rb") as f:
            files = {"file": f}
            # Using 'tiny' model for faster verification, and a small beam size
            data = {"model_size": "tiny", "beam_size": 2}
            print("Sending request to API...")
            response = requests.post(API_URL, files=files, data=data)
        
        if response.status_code == 200:
            print("Success!")
            result = response.json()
            
            segments = result.get("segments", [])
            print(f"Found {len(segments)} segments.")
            print("\n--- Speaker Segments (First 5) ---")
            for segment in segments[:5]:
                start = segment['start']
                end = segment['end']
                speaker = segment['speaker']
                text = segment['text']
                print(f"[{start:.2f}s - {end:.2f}s] {speaker}: {text}")
            if len(segments) > 5:
                print("...")
                
        else:
            print(f"Failed with status code {response.status_code}")
            print("Response:", response.text)

    except Exception as e:
        print(f"An error occurred: {e}")

def run_tests():
    if not os.path.exists(TEST_FILES_DIR):
        print(f"Test directory not found: {TEST_FILES_DIR}")
        return

    files = glob.glob(os.path.join(TEST_FILES_DIR, "*"))
    # Filter for audio extensions if needed, but for now take all files
    audio_extensions = ['.m4a', '.wav', '.mp3']
    audio_files = [f for f in files if os.path.splitext(f)[1].lower() in audio_extensions]

    if not audio_files:
        print("No audio files found in directory.")
        return

    print(f"Found {len(audio_files)} audio files.")
    for file_path in audio_files:
        test_file(file_path)

if __name__ == "__main__":
    run_tests()
