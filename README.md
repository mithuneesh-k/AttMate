# 📋 AttMate — Smart Attendance Management System

> **AttMate** is a full-stack mobile application that lets teachers manage class attendance through a natural-language chat interface. Instead of filling out grids or tapping individual checkboxes, a teacher simply types *"101, 102 absent | 144 OD"* and the system parses, validates, and saves the records instantly.

---

## ✨ Features

### 🤖 Natural Language Attendance Input
AttMate's built-in **Smart Parser** understands how teachers actually speak — no AI API required. Just type the way you would in a text message:

| Input | What Happens |
|---|---|
| `101, 102, 103 absent` | Marks three students absent; rest auto-marked present |
| `Mark 104 as OD` | Marks roll 104 as On Duty |
| `Roll numbers 105 to 110 present` | Marks a full range present |
| `Everyone present except 111, 112` | Marks all students present except two |
| `115 absent, 116 od, 117 present` | Handles mixed statuses in one message |
| `Who was absent today?` | Queries the database and returns names |

Typos? The parser corrects common mistakes like `"abssent"` → `"absent"` automatically.

### 👥 Role-Based Access Control
- **Admin** — manages classes, faculty accounts, subject assignments, and class advisors
- **Teacher** — views only their assigned classes/subjects and records attendance

### 📊 Attendance Analytics
- Per-subject attendance percentages for a class
- Per-student breakdown (present count, absent count, percentage)
- Overall class average across all subjects
- Visual attendance sheet grid by date

### 💬 Chat History & Sessions
- Full scrollable chat history per class-subject pair
- Session management (start a new session within the same day)
- Timestamps on every message

### 📁 CSV Student Import
- Bulk-import students via CSV upload (Roll Number + Name columns)
- Prevents duplicate entries automatically

### ☁️ Cloud-Ready Backend
- Deployable on **Render** with a built-in keep-alive mechanism
- Uses **PostgreSQL** in production
- CORS-enabled for cross-origin mobile access

---

## 🏗️ Architecture

```
AttMate/
├── backend/              # Python FastAPI REST API
│   ├── main.py           # All API endpoints (auth, admin, teacher, chat)
│   ├── models.py         # SQLAlchemy ORM models
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── database.py       # DB engine + session factory
│   ├── smart_parser.py   # Natural language attendance parser (no AI needed)
│   ├── seed_db.py        # Database seeder for demo data
│   ├── keep_alive.py     # Render free-tier ping to prevent cold starts
│   └── requirements.txt
│
├── frontend/             # React Native (Expo) mobile app
│   ├── App.js            # Root navigation (Stack Navigator)
│   ├── api.js            # Axios base URL config
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── AdminDashboard.js
│   │   ├── ManageClasses.js
│   │   ├── ManageFaculty.js
│   │   ├── TeacherHome.js
│   │   ├── ClassChat.js        # ← Core chat UI
│   │   ├── ClassDashboard.js
│   │   ├── SubjectDashboard.js
│   │   └── Stats.js
│   ├── components/
│   │   ├── Header.js
│   │   └── BottomNav.js
│   ├── context/AuthContext.js  # Global auth state
│   └── styles/theme.js         # Shared design tokens
│
└── data/
    └── sample_students.csv     # Template for CSV import
```

### Data Model

```
User ──< Faculty ──< FacultySubject >── Subject
                         │
                       Class ──< Student ──< Attendance
                         │
                     ChatMessage
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Mobile Frontend** | React Native 0.81 · Expo 54 |
| **Navigation** | React Navigation (Stack) |
| **HTTP Client** | Axios |
| **Backend API** | FastAPI (Python) |
| **ORM** | SQLAlchemy |
| **Database** | PostgreSQL (production) |
| **Validation** | Pydantic v2 |
| **Data Processing** | Pandas |
| **Hosting** | Render (backend) |
| **Auth Storage** | AsyncStorage (device-local) |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Expo CLI (`npm install -g expo-cli`)
- PostgreSQL

---

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
# Edit .env and set your database URL:
# DATABASE_URL=postgresql://user:password@host:5432/attmate_db

# 5. Seed the database with demo data
python seed_db.py

# 6. Start the development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be running at `http://localhost:8000`. Visit `/docs` for the interactive Swagger UI.

---

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Update the API base URL
# Edit api.js and set API_BASE_URL to your backend address:
# e.g. http://<your-local-ip>:8000  (for same Wi-Fi testing)
# e.g. https://your-app.onrender.com  (for cloud)

# 4. Start the Expo dev server
npm start

# 5. Scan the QR code with Expo Go (iOS/Android)
#    or press 'w' to open in the browser
```

---

### Default Demo Credentials

After running `seed_db.py`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@college.edu` | `admin123` |
| Teacher | `teacher@college.edu` | `teacher123` |

---

## 🌐 Deploying to the Cloud

### Backend on Render

1. Push the `backend/` folder to a GitHub repository.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add your `DATABASE_URL` as an environment variable.
6. Update `frontend/api.js` with the Render deployment URL.

> The `keep_alive.py` module automatically pings the backend every 14 minutes to prevent Render's free tier from spinning down.

### Accessing from Mobile Data

By default the backend runs on your local network. To expose it globally for demos:

```bash
# Option 1: ngrok tunnel (quick demo)
ngrok http 8000
# Copy the https://... URL into frontend/api.js

# Option 2: Deploy to Render/Heroku (permanent)
```

See [ACCESS_GUIDE.md](ACCESS_GUIDE.md) for more details.

---

## 📱 Screens Overview

| Screen | Role | Description |
|---|---|---|
| `LoginScreen` | All | Email + password login with role selection |
| `AdminDashboard` | Admin | Overview stats (classes, faculty, students) |
| `ManageClasses` | Admin | Create classes, assign advisors |
| `ManageFaculty` | Admin | Add faculty, assign subject-class pairs |
| `TeacherHome` | Teacher | List of assigned classes |
| `ClassChat` | Teacher | **Main chat UI** — type attendance in natural language |
| `ClassDashboard` | Teacher | Per-class attendance percentages by subject |
| `SubjectDashboard` | Teacher | Per-student breakdown table for a subject |
| `Stats` | Teacher | Visual stats for the advisory class |

---

## 🧠 How the Smart Parser Works

The `SmartAttendanceParser` in `backend/smart_parser.py` uses a layered approach — **no external AI API**:

1. **Query Detection** — If the message starts with "who" or "which", it routes to a read-only query handler.
2. **Keyword Window Parsing** — Scans the message for status keywords (`absent`, `OD`, `present`, `leave`) and extracts the roll numbers appearing before each keyword.
3. **Regex Pattern Fallback** — 10 compiled regex patterns cover formats like ranges (`101 to 110 absent`), exception lists (`everyone present except 112`), and mixed statuses.
4. **Typo Correction** — The `AdvancedAttendanceParser` subclass pre-corrects common typos before parsing.
5. **Auto-Present Logic** — If any student is marked Absent or OD, all *other* unmarked students are automatically marked Present.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

Built with [FastAPI](https://fastapi.tiangolo.com/), [React Native](https://reactnative.dev/), and [Expo](https://expo.dev/).
