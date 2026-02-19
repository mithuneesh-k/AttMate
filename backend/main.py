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
        # Count subjects assigned to this faculty
        subject_assignments = db.query(models.FacultySubject).filter(models.FacultySubject.faculty_id == user.faculty_profile.id).all()
        response_data["subjects"] = [{"id": a.subject_id} for a in subject_assignments] # Profile.js uses .length

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
        subs = db.query(models.Subject).join(models.FacultySubject).filter(
            models.FacultySubject.class_id == c.id, 
            models.FacultySubject.faculty_id == faculty.id
        ).all()
        result.append({
            "id": c.id,
            "name": c.name,
            "subjects": [{"id": s.id, "name": s.name} for s in subs]
        })
    return result

@app.get("/teacher/class-stats/{class_id}")
def get_class_stats(class_id: int, db: Session = Depends(database.get_db)):
    from sqlalchemy import func
    
    # Calculate overall attendance for the class
    total_students = db.query(models.Student).filter(models.Student.class_id == class_id).count()
    if total_students == 0:
        return {"overall": 0, "subjects": []}
    
    # Subject wise stats
    assignments = db.query(models.FacultySubject).filter(models.FacultySubject.class_id == class_id).all()
    subject_stats = []
    
    total_percentage_sum = 0
    subject_count = 0

    for a in assignments:
        sub = db.query(models.Subject).filter(models.Subject.id == a.subject_id).first()
        
        # 1. Calculate Total Sessions (Unique Dates)
        sessions = db.query(func.count(func.distinct(models.Attendance.date))).filter(
            models.Attendance.class_id == class_id,
            models.Attendance.subject_id == sub.id
        ).scalar()
        
        # 2. Calculate Total Present/OD Records
        present_od_count = db.query(models.Attendance).filter(
            models.Attendance.class_id == class_id,
            models.Attendance.subject_id == sub.id,
            models.Attendance.status.in_(['Present', 'OD'])
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
        
        processed_students = []
        for roll, status in entries_to_process:
            student = db.query(models.Student).filter(
                models.Student.roll_number == roll,
                models.Student.class_id == class_id
            ).first()
            
            if student:
                marked_student_ids.append(student.id)
                processed_students.append(roll)
                
                # Check if record exists
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
                # Check/Create attendance 'Present'
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

            response_text = f"✓ Marked {processed_count} students as {entries_to_process[0][1] if entries_to_process else 'specified status'}.\n"
            response_text += f"✓ Automatically marked {auto_present_count} others as Present."
        else:
             response_text = f"✓ Marked {processed_count} students."

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
    
    dates = [d[0] for d in dates_query]

    # 3. Build the grid
    # Row: { name: "Student Name", roll: "101", date1: "P", date2: "A", ... }
    
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
        
        # Map date to status
        att_map = {rec.date: rec.status for rec in recs}
        
        for d in dates:
            date_str = d.isoformat()
            status = att_map.get(d, "-") # - for no record
            # Normalize status for frontend (P, A, O)
            short_status = "-"
            if status == "Present": short_status = "P"
            elif status == "Absent": short_status = "A"
            elif status == "OD": short_status = "O"
            
            row["attendance"][date_str] = short_status
            
        grid.append(row)
        
    return {
        "dates": [d.isoformat() for d in dates],
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
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.class_id == class_id,
        models.ChatMessage.subject_id == subject_id
    ).order_by(models.ChatMessage.timestamp.asc()).limit(limit).all()
    
    return {
        "messages": [
            {
                "id": msg.id,
                "text": msg.message_text,
                "type": msg.message_type,
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in messages
        ]
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

