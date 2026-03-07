import sys
import os

# Add the current directory to sys.path to import smart_parser
sys.path.append(os.getcwd())

from smart_parser import AdvancedAttendanceParser

def test_parser():
    parser = AdvancedAttendanceParser()
    class_id = 3
    subject_id = 12
    
    test_cases = [
        "Log: Today we covered React Hooks and State Management",
        "101 absent, 102 present, 103 OD Session 1",
        "Who is absent today?",
        "Everyone present except 115, 116",
        "Roll 1 to 5 absent",
        "144, 145 od",
        "Just 133 absent please"
    ]
    
    print(f"{'INPUT':<60} | {'RESULT'}")
    print("-" * 100)
    for tc in test_cases:
        result = parser.parse(tc, class_id, subject_id)
        pt = result.get('pattern_type', 'ERROR')
        print(f"{tc:<60} | {pt}")
        if pt == 'multiple':
            print(f"  -> Entries: {result['entries']}")
        elif pt == 'log':
            print(f"  -> Content: {result['content']}")
        elif pt == 'query':
            print(f"  -> Status: {result['status']}, Date: {result['query_date']}")
        elif pt == 'exception':
            print(f"  -> Roll Numbers: {result['roll_numbers']}, Status: {result['status']}")
        elif pt == 'range':
            print(f"  -> Roll Numbers: {result['roll_numbers']}, Status: {result['status']}")
        elif 'error' in result:
            print(f"  -> Error: {result['error']}")

if __name__ == "__main__":
    test_parser()
