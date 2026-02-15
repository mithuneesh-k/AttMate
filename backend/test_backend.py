import requests
import time

BASE_URL = "http://127.0.0.1:8000"

def test_root():
    try:
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        print("Root endpoint: OK")
    except Exception as e:
        print(f"Root endpoint failed: {e}")

if __name__ == "__main__":
    # Wait for server to start if running in parallel
    time.sleep(2)
    test_root()
