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
