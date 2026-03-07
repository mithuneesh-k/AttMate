from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from sqlalchemy.exc import OperationalError
from typing import List
import pandas as pd
import io
import re
from datetime import date, datetime
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

@app.post("/admin/reset-history")
def reset_history(db: Session = Depends(database.get_db)):
    """Reset all attendance and chat history."""
    try:
        db.query(models.Attendance).delete()
        db.query(models.ChatMessage).delete()
        db.commit()
        return {"message": "Attendance and chat history reset successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

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
        sessions_query = db.query(models.Attendance.date).filter(
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

    # Calculate start of day for queries
    today_start = datetime.combine(today, datetime.min.time())

    # Check if parsing was successful
    if "error" not in parse_result:
        
        # 0. HANDLE LOG ENTRIES
        if parse_result.get('pattern_type') == 'log':
            log_content = parse_result.get('content')
            db_log = models.SessionLog(
                date=today,
                content=log_content,
                class_id=class_id,
                subject_id=subject_id,
                faculty_id=faculty_id
            )
            db.add(db_log)
            response_text = f"Logged: {log_content[:50]}..." if len(log_content) > 50 else f"Logged: {log_content}"
            processed_count = 1

        # 1. HANDLE DATA FETCHING QUERIES
        elif parse_result.get('pattern_type') == 'query':
            query_status = parse_result.get('status', 'Absent')
            query_date_str = parse_result.get('query_date')
            
            # Resolve relative dates
            target_date = today
            if query_date_str:
                query_date_str = query_date_str.lower()
                if query_date_str == 'yesterday':
                    import datetime as dt
                    target_date = today - dt.timedelta(days=1)
                elif query_date_str != 'today':
                    try:
                        # Try parsing common date formats
                        from dateutil import parser as dt_parser
                        parsed_dt = dt_parser.parse(query_date_str)
                        target_date = parsed_dt.date()
                    except:
                        pass # Fallback to today if unparseable
                        
            # Query the database
            records = db.query(models.Attendance, models.Student)\
                        .join(models.Student, models.Attendance.student_id == models.Student.id)\
                        .filter(models.Attendance.class_id == class_id,
                                models.Attendance.subject_id == subject_id,
                                models.Attendance.date == target_date,
                                func.lower(models.Attendance.status) == query_status.lower())\
                        .all()
            
            if records:
                students_list = ", ".join([student.name for att, student in records])
                response_text = f"The following students were marked {query_status} on {target_date.strftime('%b %d, %Y')}:\n{students_list}"
            else:
                response_text = f"Nobody was marked {query_status} on {target_date.strftime('%b %d, %Y')}."
                
            processed_count = len(records)
            
        # 2. PROCESS EXPLICIT ENTRIES (WRITE MODES)
        entries_to_process = []
        
        # If the parser returned a list of individual entries (e.g. mixed statuses)
        if 'entries' in parse_result:
            entries = parse_result.get('entries', [])
            for entry in entries:
                entries_to_process.append((entry['roll_number'], entry['status']))
        
        # Fallback for older pattern matching that returns roll_numbers + single status
        elif 'roll_numbers' in parse_result:
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
                
                # Check if record exists for today
                att = db.query(models.Attendance).filter(
                    models.Attendance.student_id == student.id,
                    models.Attendance.date == today,
                    models.Attendance.subject_id == subject_id
                ).first()
                
                if not att:
                    att = models.Attendance(
                        date=today,
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
                # Check/Create attendance 'Present' for today
                att = db.query(models.Attendance).filter(
                    models.Attendance.student_id == student.id,
                    models.Attendance.date == today,
                    models.Attendance.subject_id == subject_id
                ).first()
                
                if not att:
                    att = models.Attendance(
                        date=today,
                        status="Present",
                        student_id=student.id,
                        class_id=class_id,
                        subject_id=subject_id
                    )
                    db.add(att)
                    auto_present_count += 1
                # If already exists, we do NOT overwrite automatically to avoid accidents
                # unless logic dictates otherwise. For now, we only fill gaps.

            status_counts = {}
            for _, s in entries_to_process:
                status_counts[s] = status_counts.get(s, 0) + 1
            
            summary_parts = [f"{count} {s}" for s, count in status_counts.items()]
            if auto_present_count > 0:
                summary_parts.append(f"{auto_present_count} Present (auto)")
                
            response_text = "Marked: " + ", ".join(summary_parts)
        else:
             response_text = f"Updated records for {processed_count} students."

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
    
    # 2. Get all distinct dates for this subject and class
    # We want dates where at least one attendance record exists
    dates_query = db.query(models.Attendance.date).filter(
        models.Attendance.class_id == class_id,
        models.Attendance.subject_id == subject_id
    ).distinct().order_by(models.Attendance.date.asc()).all()
    
    # Store as string "YYYY-MM-DD"
    dates = [f"{d[0].isoformat()}" for d in dates_query]

    # 3. Fetch all attendance records for this class and subject in ONE query (Bulk Fetch)
    all_attendance = db.query(models.Attendance).filter(
        models.Attendance.class_id == class_id,
        models.Attendance.subject_id == subject_id
    ).all()

    # Group records by student_id for O(1) lookup
    from collections import defaultdict
    student_att_map = defaultdict(dict)
    for rec in all_attendance:
        d_str = rec.date.isoformat()
        
        # Normalize status
        short_s = "-"
        raw_s = rec.status.lower() if rec.status else ""
        if raw_s in ["present", "p"]: short_s = "P"
        elif raw_s in ["absent", "a"]: short_s = "A"
        elif raw_s in ["od", "o"]: short_s = "O"
        
        student_att_map[rec.student_id][d_str] = short_s

    # 4. Build the grid using the in-memory map
    grid = []
    for student in students:
        row = {
            "id": student.id,
            "name": student.name,
            "roll": student.roll_number,
            "attendance": {}
        }
        
        # Get pre-filled attendance for this student
        att_data = student_att_map.get(student.id, {})
        
        for d_key in dates:
            row["attendance"][d_key] = att_data.get(d_key, "-")
            
        grid.append(row)
        
    return {
        "dates": dates,
        "students": grid
    }

@app.get("/teacher/day-details/{class_id}/{date_str}")
def get_day_details(class_id: int, date_str: str, db: Session = Depends(database.get_db)):
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Fetch Logs for this class on this date
    logs = db.query(models.SessionLog).filter(
        models.SessionLog.class_id == class_id,
        models.SessionLog.date == target_date
    ).all()

    # Fetch Attendance summary for this class on this date
    # Group by subject
    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.class_id == class_id,
        models.Attendance.date == target_date
    ).all()

    subjects = db.query(models.Subject).all()
    sub_map = {s.id: s.name for s in subjects}

    att_summary = {}
    for rec in attendance_records:
        sub_name = sub_map.get(rec.subject_id, "Unknown")
        if sub_name not in att_summary:
            att_summary[sub_name] = {"Present": 0, "Absent": 0, "OD": 0, "Leave": 0}
        
        status = rec.status
        if status in att_summary[sub_name]:
            att_summary[sub_name][status] += 1

    return {
        "date": date_str,
        "logs": logs,
        "attendance": att_summary
    }

@app.post("/teacher/update-attendance")
def update_attendance(data: dict, db: Session = Depends(database.get_db)):
    """
    Manually update/override attendance record.
    Expected data: { student_id, class_id, subject_id, date, status }
    """
    student_id = data.get('student_id')
    class_id = data.get('class_id')
    subject_id = data.get('subject_id')
    date_str = data.get('date')
    status = data.get('status')
    
    if not all([student_id, class_id, subject_id, date_str, status]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    # Check if record exists
    record = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.class_id == class_id,
        models.Attendance.subject_id == subject_id,
        models.Attendance.date == target_date
    ).first()

    if record:
        record.status = status
    else:
        record = models.Attendance(
            student_id=student_id,
            class_id=class_id,
            subject_id=subject_id,
            date=target_date,
            status=status
        )
        db.add(record)
    
    db.commit()
    return {"status": "success", "new_status": status}

@app.get("/teacher/session-logs/{class_id}/{subject_id}")
def get_session_logs(class_id: int, subject_id: int, db: Session = Depends(database.get_db)):
    logs = db.query(models.SessionLog).filter(
        models.SessionLog.class_id == class_id,
        models.SessionLog.subject_id == subject_id
    ).order_by(models.SessionLog.timestamp.desc()).all()
    return logs

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
        "messages": msgs_out
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
        # 1. Total Working Days (Sessions where student SHOULD have been present)
        # We query unique dates for this subject and class
        working_days = db.query(models.Attendance.date).filter(
            models.Attendance.class_id == class_id,
            models.Attendance.subject_id == subject.id
        ).distinct().count()

        # 2. Present Count (Present + OD)
        p_count = db.query(models.Attendance).filter(
            models.Attendance.student_id == s.id,
            models.Attendance.subject_id == subject.id,
            func.lower(models.Attendance.status).in_(['present', 'od', 'p', 'o'])
        ).count()

        # 3. Absent Count
        a_count = db.query(models.Attendance).filter(
            models.Attendance.student_id == s.id,
            models.Attendance.subject_id == subject.id,
            func.lower(models.Attendance.status).in_(['absent', 'a'])
        ).count()
        
        percent = round((p_count / working_days * 100), 1) if working_days > 0 else 0
        
        result.append({
            "roll_number": s.roll_number,
            "name": s.name,
            "present_count": p_count,
            "absent_count": a_count,
            "attendance_percentage": percent
        })
    return result

# --- SESSION LOGS ---
@app.post("/teacher/session-logs", response_model=schemas.SessionLog)
def create_session_log(log: schemas.SessionLogCreate, db: Session = Depends(database.get_db)):
    db_log = models.SessionLog(
        date=log.date,
        content=log.content,
        class_id=log.class_id,
        subject_id=log.subject_id,
        faculty_id=log.faculty_id
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/teacher/session-logs/{class_id}/{subject_id}", response_model=List[schemas.SessionLog])
def get_session_logs(class_id: int, subject_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.SessionLog).filter(
        models.SessionLog.class_id == class_id,
        models.SessionLog.subject_id == subject_id
    ).order_by(models.SessionLog.date.desc()).all()

