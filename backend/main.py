from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from typing import List
import pandas as pd
import io
import re
from datetime import date
from fastapi.middleware.cors import CORSMiddleware
from . import models, schemas, database
from .database import engine

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
    return user

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
            "subjects": ", ".join([s.name for s in subs])
        })
    return result

@app.get("/teacher/class-stats/{class_id}")
def get_class_stats(class_id: int, db: Session = Depends(database.get_db)):
    # Calculate overall attendance for the class
    total_students = db.query(models.Student).filter(models.Student.class_id == class_id).count()
    if total_students == 0:
        return {"overall": 0, "subjects": []}
    
    # Subject wise stats
    assignments = db.query(models.FacultySubject).filter(models.FacultySubject.class_id == class_id).all()
    subject_stats = []
    for a in assignments:
        sub = db.query(models.Subject).filter(models.Subject.id == a.subject_id).first()
        # Mocking attendance for demo if no real records
        att_percent = 85 # Default
        subject_stats.append({
            "name": sub.name,
            "attendance": att_percent,
            "working_days": 40
        })
    
    return {
        "overall": 86,
        "subjects": subject_stats
    }

# --- CHAT & ATTENDANCE ---
@app.post("/chat/")
async def chat_interaction(message: str, class_id: int, subject_id: int, db: Session = Depends(database.get_db)):
    import re
    from datetime import date
    
    # Extract roll numbers and status
    # Pattern: "101, 102 absent" or "103 OD"
    absent_match = re.search(r'([\d, \s]+)\s+absent', message.lower())
    od_match = re.search(r'([\d, \s]+)\s+od', message.lower())
    
    response_text = ""
    
    def process_rolls(match, status):
        rolls = [r.strip() for r in match.group(1).replace(',', ' ').split() if r.strip()]
        count = 0
        for roll in rolls:
            student = db.query(models.Student).filter(models.Student.roll_number == roll, models.Student.class_id == class_id).first()
            if student:
                today = date.today()
                att = db.query(models.Attendance).filter(
                    models.Attendance.student_id == student.id, 
                    models.Attendance.date == today,
                    models.Attendance.subject_id == subject_id
                ).first()
                if not att:
                    att = models.Attendance(date=today, status=status, student_id=student.id, class_id=class_id, subject_id=subject_id)
                    db.add(att)
                else:
                    att.status = status
                count += 1
        db.commit()
        return count, rolls

    if absent_match:
        c, r = process_rolls(absent_match, "Absent")
        response_text += f"Marked {c} students absent: {', '.join(r)}. "
    
    if od_match:
        c, r = process_rolls(od_match, "OD")
        response_text += f"Marked {c} students as OD: {', '.join(r)}. "
        
    if not response_text:
        response_text = "Could not parse attendance. Use format: '101, 102 absent | 103 OD'"
        
    return {"response": response_text}

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

