# AttMate Backend

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up MySQL database and update `database.py` with credentials.

## Run

```bash
uvicorn main:app --reload
```

## API

- `POST /upload_csv/{class_name}`: Upload a CSV file with "Roll Number" and "Name".
- `POST /chat/`: Send a message like "101 absent" to mark attendance.
