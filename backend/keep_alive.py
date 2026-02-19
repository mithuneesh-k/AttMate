import requests
import time
import os
import threading

# The URL to ping (will be set via env var or hardcoded after deployment)
PING_URL = os.environ.get("RENDER_EXTERNAL_URL") 

def ping_server():
    if not PING_URL:
        print("⚠ No RENDER_EXTERNAL_URL found. Keep-alive ping disabled.")
        return

    while True:
        try:
            print(f"⏰ Keep-alive: Pinging {PING_URL}...")
            response = requests.get(PING_URL)
            print(f"✅ Keep-alive: Status {response.status_code}")
        except Exception as e:
            print(f"❌ Keep-alive failed: {e}")
        
        # Wait 14 minutes (14 * 60 = 840 seconds)
        time.sleep(840)

def start_keep_alive():
    """Starts the pinger in a background thread."""
    thread = threading.Thread(target=ping_server, daemon=True)
    thread.start()
