from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from typing import List
import pandas as pd
import io
import re
from datetime import date
from fastapi.middleware.cors import CORSMiddleware
import models, schemas, database
from database import engine

try:
    models.Base.metadata.create_all(bind=engine)
except OperationalError as e:
    print(f"Warning: Could not connect to database. Error: {e}")
except Exception as e:
    print(f"Warning: Unexpected error: {e}")

app = FastAPI()

# --- KEEP ALIVE (For Render Free Tier) ---
try:
    from keep_alive import start_keep_alive
    @app.on_event("startup")
    async def startup_event():
        start_keep_alive()
except ImportError:
    pass


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AttMate Backend is running!"}

@app.get("/seed-db")
def seed_remote_db():
    import os
    try:
        os.system("python seed_db.py")
        return {"message": "Database seeding triggered successfully. Please try logging in now."}
    except Exception as e:
        return {"error": str(e)}

# --- AUTH ---
@app.post("/login")
def login(login_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    print(f"DEBUG: Incoming login request for {login_data.email} as {login_data.role}")
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user:
        print("DEBUG: User not found in database.")
        # For MVP/Demo: If no users, allow creating first admin
        if db.query(models.User).count() == 0:
             print("DEBUG: Database empty. Creating first admin user.")
             new_user = models.User(email=login_data.email, password=login_data.password, role=login_data.role)
             db.add(new_user)
             db.commit()
             db.refresh(new_user)
             print(f"DEBUG: First admin created: {new_user.id}")
             return new_user
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.password != login_data.password:
        print("DEBUG: Password mismatch.")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    print(f"DEBUG: Login successful for user ID: {user.id}")
    
    response_data = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "name": "Administrator" if user.role == 'admin' else "Teacher"
    }

    if user.role == 'teacher' and user.faculty_profile:
        response_data["name"] = user.faculty_profile.name
        response_data["department"] = user.faculty_profile.department
        subject_assignments = db.query(models.FacultySubject).filter(models.FacultySubject.faculty_id == user.faculty_profile.id).all()
        unique_subjects = set(a.subject_id for a in subject_assignments)
        unique_classes = set(a.class_id for a in subject_assignments)
        response_data["subjects"] = [{"id": s} for s in unique_subjects]
        response_data["classes"] = [{"id": c} for c in unique_classes]

    return response_data

# --- ADMIN ENDPOINTS ---
@app.get("/admin/stats")
def get_admin_stats(db: Session = Depends(database.get_db)):
    return {
        "total_classes": db.query(models.Class).count(),
        "total_faculty": db.query(models.Faculty).count(),
        "total_students": db.query(models.Student).count()
    }

@app.get("/admin/classes", response_model=List[schemas.Class])
def list_classes(db: Session = Depends(database.get_db)):
    return db.query(models.Class).all()

@app.post("/admin/classes", response_model=schemas.Class)
def create_class(cls: schemas.ClassCreate, db: Session = Depends(database.get_db)):
    db_class = models.Class(name=cls.name)
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

@app.get("/admin/faculty", response_model=List[schemas.Faculty])
def list_faculty(db: Session = Depends(database.get_db)):
    return db.query(models.Faculty).all()

@app.post("/admin/faculty")
def create_faculty(faculty: schemas.FacultyCreate, name: str, dept: str, db: Session = Depends(database.get_db)):
    db_faculty = models.Faculty(user_id=faculty.user_id, name=name, department=dept)
    db.add(db_faculty)
    db.commit()
    db.refresh(db_faculty)
    return db_faculty

@app.post("/admin/assign")
def assign_subject(assignment: schemas.FacultySubjectCreate, db: Session = Depends(database.get_db)):
    db_assignment = models.FacultySubject(**assignment.dict())
    db.add(db_assignment)
    db.commit()
    return {"message": "Assigned successfully"}

@app.get("/admin/subjects", response_model=List[schemas.Subject])
def list_subjects(db: Session = Depends(database.get_db)):
    return db.query(models.Subject).all()

@app.post("/admin/subjects", response_model=schemas.Subject)
def create_subject(sub: schemas.SubjectCreate, db: Session = Depends(database.get_db)):
    db_sub = models.Subject(name=sub.name)
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

# --- TEACHER ENDPOINTS ---
@app.get("/teacher/my-classes")
def get_teacher_classes(user_id: int, db: Session = Depends(database.get_db)):
    faculty = db.query(models.Faculty).filter(models.Faculty.user_id == user_id).first()
    if not faculty:
        return []
    
    # Get all distinct classes assigned to this faculty
    assignments = db.query(models.FacultySubject).filter(models.FacultySubject.faculty_id == faculty.id).all()
    class_ids = list(set([a.class_id for a in assignments]))
    classes = db.query(models.Class).filter(models.Class.id.in_(class_ids)).all()
    
    result = []
    for c in classes:
        # Get subjects for this class for this teacher
        # Use distinct to avoid duplicates if multiple assignments exist
        subs = db.query(models.Subject).join(models.FacultySubject).filter(
            models.FacultySubject.class_id == c.id, 
            models.FacultySubject.faculty_id == faculty.id
        ).distinct().all()
        
        result.append({
            "id": c.id,
            "name": c.name,
            "subjects": [{"id": s.id, "name": s.name} for s in subs]
        })
    return result

@app.get("/teacher/my-advisory-class")
def get_advisory_class(user_id: int, db: Session = Depends(database.get_db)):
    faculty = db.query(models.Faculty).filter(models.Faculty.user_id == user_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
        
    cls = db.query(models.Class).filter(models.Class.advisor_id == faculty.id).first()
    if not cls:
        return None
    return {"id": cls.id, "name": cls.name}

@app.get("/teacher/class-stats/{class_id}")
def get_class_stats(class_id: int, user_id: int, db: Session = Depends(database.get_db)):
    from sqlalchemy import func
    
    print(f"DEBUG: get_class_stats class_id={class_id} user_id={user_id}")
    
    # 1. Verify Class Exists
    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    # 2. Get Faculty
    faculty = db.query(models.Faculty).filter(models.Faculty.user_id == user_id).first()
    is_advisor = False
    if faculty and class_obj.advisor_id == faculty.id:
        is_advisor = True
    
    print(f"DEBUG: Faculty={faculty.name if faculty else 'None'}, IsAdvisor={is_advisor}")

    # 3. Strategy: Get assignments. 
    # If Advisor -> Get All Subjects (distinct)
    # If Faculty -> Get Assigned Subjects (distinct)
    # But to be safe, let's query specific subjects first
    
    unique_assignments = []
    
    if is_advisor:
        # Fetch all subjects linked to this class (via any faculty)
        # We need distinct Subject IDs linked to this class
        assignments = db.query(models.FacultySubject).filter(models.FacultySubject.class_id == class_id).all()
    else:
        # Fetch only subjects assigned to THIS faculty for THIS class
        if faculty:
            assignments = db.query(models.FacultySubject).filter(
                models.FacultySubject.class_id == class_id, 
                models.FacultySubject.faculty_id == faculty.id
            ).all()
        else:
            assignments = []

    # Filter unique subjects
    seen = set()
    for a in assignments:
        if a.subject_id not in seen:
            unique_assignments.append(a)
            seen.add(a.subject_id)
            
    print(f"DEBUG: Found {len(unique_assignments)} unique subjects for stats.")

    # Calculate overall attendance for the class
    total_students = db.query(models.Student).filter(models.Student.class_id == class_id).count()
    if total_students == 0:
        return {"overall": 0, "subjects": []}
    
    # Subject wise stats
    subject_stats = []
    
    total_percentage_sum = 0
    subject_count = 0
    # Correction: To calculate overall attendance, we should sum all subject % and divide by count?
    # Or calculate (Total Present across all subjects / Total Sessions * Students)?
    # Let's stick to average of percentages for now or simplified logic.
    
    for a in unique_assignments:
        sub = db.query(models.Subject).filter(models.Subject.id == a.subject_id).first()
        
        # 1. Calculate Total Sessions (Unique Dates)
        # 1. Calculate Total Sessions (Unique Dates + Sessions)
        sessions_query = db.query(models.Attendance.date, models.Attendance.session_n).filter(
            models.Attendance.class_id == class_id,
            models.Attendance.subject_id == sub.id
        ).distinct().all()
        sessions = len(sessions_query)
        
        # 2. Calculate Total Present/OD Records
        present_od_count = db.query(models.Attendance).filter(
            models.Attendance.class_id == class_id,
            models.Attendance.subject_id == sub.id,
            func.lower(models.Attendance.status).in_(['present', 'od', 'p', 'o'])
        ).count()
        
        # 3. Calculate Percentage
        # Total possible attendance = Sessions * Total Students
        total_possible = sessions * total_students
        
        if total_possible > 0:
            att_percent = round((present_od_count / total_possible) * 100, 1)
        else:
            att_percent = 0
            
        subject_stats.append({
            "id": sub.id,
            "name": sub.name,
            "attendance": att_percent,
            "working_days": sessions
        })
        
        total_percentage_sum += att_percent
        subject_count += 1
    
    # Calculate overall class average
    overall_avg = round(total_percentage_sum / subject_count, 1) if subject_count > 0 else 0
    
    return {
        "overall": overall_avg,
        "subjects": subject_stats
    }

# --- CHAT & ATTENDANCE ---
@app.post("/chat/")
async def chat_interaction(
    message: str, 
    class_id: int, 
    subject_id: int,
    faculty_id: int = None,
    db: Session = Depends(database.get_db)
):
    from datetime import date, datetime
    from smart_parser import AdvancedAttendanceParser
    from sqlalchemy import and_
    
    # Save user message to database
    user_msg = models.ChatMessage(
        message_text=message,
        message_type='teacher',
        class_id=class_id,
        subject_id=subject_id,
        faculty_id=faculty_id,
        timestamp=datetime.utcnow()
    )
    db.add(user_msg)
    db.flush()  # Get the ID without committing yet
    
    # Initialize smart parser
    parser = AdvancedAttendanceParser()
    
    # Parse the input
    parse_result = parser.parse(message, class_id, subject_id)
    
    response_text = ""
    processed_count = 0
    today = date.today()
    
    # List to track students who were marked (absent/od/present)
    marked_student_ids = []

    # Calculate session_n for today
    today_start = datetime.combine(today, datetime.min.time())
    
    from sqlalchemy import func
    session_match = re.search(r'session\s*(\d+)', message, re.IGNORECASE)
    if session_match:
        current_session_n = int(session_match.group(1))
    else:
        max_s = db.query(func.max(models.Attendance.session_n)).filter(
            models.Attendance.class_id == class_id,
            models.Attendance.subject_id == subject_id,
            models.Attendance.date == today
        ).scalar()
        current_session_n = max_s if max_s else 1

    # Check if parsing was successful
    if "error" not in parse_result:
        # 1. PROCESS EXPLICIT ENTRIES
        entries_to_process = []
        
        if parse_result.get('pattern_type') == 'multiple_individual':
            entries = parse_result.get('entries', [])
            for entry in entries:
                entries_to_process.append((entry['roll_number'], entry['status']))
        else:
            # Standard list/range format
            roll_numbers = parse_result.get("roll_numbers", [])
            status = parse_result.get("status", "Absent")
            for roll in roll_numbers:
                entries_to_process.append((roll, status))
        
        # Normalize statuses to strict DB case BEFORE processing
        normalized_entries = []
        for r, s in entries_to_process:
            if s.lower() == 'od':
                ns = 'OD'
            else:
                ns = s.capitalize()
            normalized_entries.append((r, ns))
        entries_to_process = normalized_entries
        
        processed_students = []
        for roll, status in entries_to_process:
            # Zero-pad numeric roll numbers up to 3 digits (e.g. '2' -> '002', '12' -> '012')
            search_roll = roll.zfill(3) if roll.isdigit() and len(roll) < 3 else roll
            
            student = db.query(models.Student).filter(
                models.Student.roll_number.endswith(search_roll),
                models.Student.class_id == class_id
            ).first()
            
            if student:
                marked_student_ids.append(student.id)
                processed_students.append(roll)
                
                # Check if record exists for this session
                att = db.query(models.Attendance).filter(
                    models.Attendance.student_id == student.id,
                    models.Attendance.date == today,
                    models.Attendance.session_n == current_session_n,
                    models.Attendance.subject_id == subject_id
                ).first()
                
                if not att:
                    att = models.Attendance(
                        date=today,
                        session_n=current_session_n,
                        status=status,
                        student_id=student.id,
                        class_id=class_id,
                        subject_id=subject_id
                    )
                    db.add(att)
                else:
                    att.status = status
                processed_count += 1
        
        # 2. AUTO-PRESENT LOGIC
        # If any students were marked as 'Absent' or 'OD', mark the rest as 'Present'
        has_absent_or_od = any(status in ['Absent', 'OD'] for _, status in entries_to_process)
        
        if has_absent_or_od and marked_student_ids:
            # Find all students in this class NOT in the marked list
            if marked_student_ids:
                all_students = db.query(models.Student).filter(
                    models.Student.class_id == class_id,
                    ~models.Student.id.in_(marked_student_ids) # NOT IN
                ).all()
            else:
                all_students = db.query(models.Student).filter(
                     models.Student.class_id == class_id
                ).all()

            auto_present_count = 0
            for student in all_students:
                # Check/Create attendance 'Present' for this session
                att = db.query(models.Attendance).filter(
                    models.Attendance.student_id == student.id,
                    models.Attendance.date == today,
                    models.Attendance.session_n == current_session_n,
                    models.Attendance.subject_id == subject_id
                ).first()
                
                if not att:
                    att = models.Attendance(
                        date=today,
                        session_n=current_session_n,
                        status="Present",
                        student_id=student.id,
                        class_id=class_id,
                        subject_id=subject_id
                    )
                    db.add(att)
                    auto_present_count += 1
                # If already exists, we do NOT overwrite automatically to avoid accidents
                # unless logic dictates otherwise. For now, we only fill gaps.

            response_text = f"{processed_count + auto_present_count} students parsed and updated"
        else:
             response_text = f"{processed_count} students parsed and updated"

    else:
        # Parsing failed - provide helpful error message
        response_text = parse_result.get('error', 'Could not parse input')
        suggestions = parse_result.get('suggestions', [])
        if suggestions:
            response_text += "\n\nTry these formats:\n" + "\n".join(f"• {s}" for s in suggestions[:3])
    
    # Save system response to database
    system_msg = models.ChatMessage(
        message_text=response_text,
        message_type='system',
        class_id=class_id,
        subject_id=subject_id,
        timestamp=datetime.utcnow()
    )
    db.add(system_msg)
    db.commit()
    db.refresh(user_msg)
    db.refresh(system_msg)
    
    return {
        "response": response_text,
        "processed_count": processed_count,
        "parser_used": "smart_parser",
        "pattern_type": parse_result.get('pattern_type', 'none'),
        "user_message_id": user_msg.id,
        "system_message_id": system_msg.id,
        "timestamp": system_msg.timestamp.isoformat()
    }

@app.get("/teacher/attendance-sheet/{class_id}/{subject_id}")
def get_attendance_sheet(class_id: int, subject_id: int, db: Session = Depends(database.get_db)):
    # 1. Get all students in class
    students = db.query(models.Student).filter(models.Student.class_id == class_id).order_by(models.Student.roll_number).all()
    
    # 2. Get all distinct (date, session_n) combinations for this subject and class
    # We want sessions where at least one attendance record exists
    dates_query = db.query(models.Attendance.date, models.Attendance.session_n).filter(
        models.Attendance.class_id == class_id,
        models.Attendance.subject_id == subject_id
    ).distinct().order_by(models.Attendance.date.asc(), models.Attendance.session_n.asc()).all()
    
    # Store as string "YYYY-MM-DD|SESSION"
    dates = [f"{d[0].isoformat()}|{d[1]}" for d in dates_query]

    # 3. Build the grid
    # Row: { name: "Student Name", roll: "101", "2026-02-18|1": "P", "2026-02-18|2": "A", ... }
    
    grid = []
    
    for student in students:
        row = {
            "name": student.name,
            "roll": student.roll_number,
            "attendance": {}
        }
        
        # Fetch all attendance for this student in this subject
        recs = db.query(models.Attendance).filter(
            models.Attendance.student_id == student.id,
            models.Attendance.subject_id == subject_id
        ).all()
        
        # Map "date|session" to status
        att_map = {f"{rec.date.isoformat()}|{rec.session_n}": rec.status for rec in recs}
        
        for d_key in dates:
            status = att_map.get(d_key, "-") # - for no record
            # Normalize status for frontend (P, A, O) case-insensitively
            short_status = "-"
            raw_s = status.lower()
            if raw_s in ["present", "p"]: short_status = "P"
            elif raw_s in ["absent", "a"]: short_status = "A"
            elif raw_s in ["od", "o"]: short_status = "O"
            
            row["attendance"][d_key] = short_status
            
        grid.append(row)
        
    return {
        "dates": dates,
        "students": grid
    }

@app.get("/chat/history/{class_id}/{subject_id}")
def get_chat_history(
    class_id: int,
    subject_id: int,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    """Get chat history for a specific class and subject"""
    from datetime import date, datetime
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.class_id == class_id,
        models.ChatMessage.subject_id == subject_id
    ).order_by(models.ChatMessage.timestamp.asc()).limit(limit).all()
    
    from sqlalchemy import func
    max_s = db.query(func.max(models.Attendance.session_n)).filter(
        models.Attendance.class_id == class_id,
        models.Attendance.subject_id == subject_id,
        models.Attendance.date == today
    ).scalar()
    
    session_n = max_s if max_s else 1
    
    msgs_out = [
        {
            "id": msg.id,
            "text": msg.message_text,
            "type": msg.message_type,
            "timestamp": msg.timestamp.isoformat()
        }
        for msg in messages
    ]
    
    return {
        "status": "success",
        "messages": msgs_out,
        "current_session": session_n
    }


@app.post("/upload_csv/{class_id}")
async def upload_students(class_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    # Expecting "Roll Number", "Name"
    for _, row in df.iterrows():
        roll = str(row['Roll Number'])
        name = row['Name']
        student = db.query(models.Student).filter(models.Student.roll_number == roll, models.Student.class_id == class_id).first()
        if not student:
            student = models.Student(roll_number=roll, name=name, class_id=class_id)
            db.add(student)
    db.commit()
    return {"message": "Imported students successfully"}

@app.get("/teacher/subject-stats/{class_id}/{subject_name}")
def get_subject_student_stats(class_id: int, subject_name: str, db: Session = Depends(database.get_db)):
    subject = db.query(models.Subject).filter(models.Subject.name == subject_name).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    students = db.query(models.Student).filter(models.Student.class_id == class_id).all()
    result = []
    
    for s in students:
        p_count = db.query(models.Attendance).filter(
            models.Attendance.student_id == s.id,
            models.Attendance.subject_id == subject.id,
            models.Attendance.status == "Present"
        ).count()
        a_count = db.query(models.Attendance).filter(
            models.Attendance.student_id == s.id,
            models.Attendance.subject_id == subject.id,
            models.Attendance.status == "Absent"
        ).count()
        
        total = p_count + a_count
        percent = round((p_count / total * 100), 1) if total > 0 else 0
        
        result.append({
            "roll_number": s.roll_number,
            "name": s.name,
            "present_count": p_count,
            "absent_count": a_count,
            "attendance_percentage": percent
        })
    return result

