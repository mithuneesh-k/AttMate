import models
from database import SessionLocal

def verify():
    db = SessionLocal()
    try:
        student_count = db.query(models.Student).count()
        class_count = db.query(models.Class).count()
        faculty_count = db.query(models.Faculty).count()
        subject_count = db.query(models.Subject).count()
        
        classes = db.query(models.Class).all()
        class_names = [c.name for c in classes]
        
        # 1. Check Specific Faculty (Sanjay Krishna)
        target_email = "sanjay.krishna@attmate.com"
        user = db.query(models.User).filter(models.User.email == target_email).first()
        print(f"\n--- Checking User: {target_email} ---")
        if not user:
            print("❌ User not found!")
        else:
            print(f"User ID: {user.id}")
            faculty = user.faculty_profile
            if not faculty:
                print("❌ No faculty profile linked!")
            else:
                print(f"Faculty: {faculty.name} (ID: {faculty.id})")
                
                # Check Assignments
                assignments = db.query(models.FacultySubject).filter(
                    models.FacultySubject.faculty_id == faculty.id
                ).all()
                
                print(f"Found {len(assignments)} assignments:")
                if not assignments:
                    print("❌ No classes assigned!")
                    
                for a in assignments:
                    cls = db.query(models.Class).filter(models.Class.id == a.class_id).first()
                    sub = db.query(models.Subject).filter(models.Subject.id == a.subject_id).first()
                    print(f"  - Class: {cls.name if cls else 'Unknown'}")
                    print(f"    Subject: {sub.name if sub else 'Unknown'}")

        print(f"Student Count: {student_count}")
        print(f"Class Count: {class_count}")
        print(f"Faculty Count: {faculty_count}")
        print(f"Subject Count: {subject_count}")
        print(f"Class Names: {class_names}")
        
        # Check specific faculty
        # Dr. A.R.Sweatha -> 25CSEB
        # Actually checking by name
        f = db.query(models.Faculty).filter(models.Faculty.name.like("%Sweatha%")).first()
        if f:
            print(f"Found Faculty: {f.name}")
            print(f"  Assignments: {[a.class_.name for a in f.assignments]}")
            print(f"  Subjects: {list(set([a.subject.name for a in f.assignments]))}")
        else:
            print("Faculty 'Sweatha' not found.")

        # Check Manokaran (Assigned to all 5 classes)
        f2 = db.query(models.Faculty).filter(models.Faculty.name.like("%Manokaran%")).first()
        if f2:
             print(f"Found Faculty: {f2.name}")
             print(f"  Assignments Count: {len(f.assignments)}") # might be 5 classes * subjects
             classes_taught = list(set([a.class_.name for a in f2.assignments]))
             print(f"  Classes Taught: {sorted(classes_taught)}")

    finally:
        db.close()

if __name__ == "__main__":
    verify()
