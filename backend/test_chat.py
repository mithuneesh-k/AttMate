import sys
import os
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from smart_parser import AdvancedAttendanceParser
from datetime import date

def test():
    db = SessionLocal()
    try:
        class_id = 1 # 25CSEA
        subject_id = 1
        message = "2, 3 absent and 4 od"
        
        parser = AdvancedAttendanceParser()
        parse_result = parser.parse(message, class_id=class_id, subject_id=subject_id)
        
        print("PARSE RESULT:")
        print(parse_result)
        
        entries_to_process = []
        if parse_result.get('pattern_type') == 'multiple_lists':
            entries = parse_result.get('entries', [])
            for entry in entries:
                entries_to_process.append((entry['roll_number'], entry['status']))
        else:
            roll_numbers = parse_result.get("roll_numbers", [])
            status = parse_result.get("status", "Absent")
            for roll in roll_numbers:
                entries_to_process.append((roll, status))
        
        print(f"\nENTRIES TO PROCESS (Raw): {entries_to_process}")
        
        normalized_entries = []
        for r, s in entries_to_process:
            if s.lower() == 'od':
                ns = 'OD'
            else:
                ns = s.capitalize()
            normalized_entries.append((r, ns))
        entries_to_process = normalized_entries
        
        print(f"ENTRIES TO PROCESS (Normalized): {entries_to_process}")
        
        processed_students = []
        marked_student_ids = []
        
        for roll, status in entries_to_process:
            # THIS IS THE PROBLEM LINE from main.py
            print(f"Looking for roll ending with {roll} in class {class_id}")
            students = db.query(models.Student).filter(
                models.Student.roll_number.endswith(roll),
                models.Student.class_id == class_id
            ).all()
            
            print(f"Found {len(students)} students matching {roll}")
            for s in students:
                print(f" - {s.roll_number} : {s.name}")
                
            student = db.query(models.Student).filter(
                models.Student.roll_number.endswith(roll),
                models.Student.class_id == class_id
            ).first()
            
            if student:
                marked_student_ids.append(student.id)
                processed_students.append(roll)
                print(f"-> Marked {student.roll_number} as {status}")
            else:
                print(f"-> NOT FOUND: {roll}")
                
    finally:
        db.close()

if __name__ == '__main__':
    test()
