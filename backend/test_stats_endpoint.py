
from fastapi.testclient import TestClient
from main import app
import models
from database import SessionLocal

client = TestClient(app)
db = SessionLocal()

def test_stats_logic():
    print("\n--- TESTING STATS ENDPOINT LOGIC ---")
    
    # 1. User: Sanjay Krishna (UserId: 13, FacultyId: 12)
    # Class: 25CSEC (ClassId: ?)
    # Subject: Web Programming Concepts (SubjectId: ?)
    
    # Get Class ID for 25CSEC
    c_csec = db.query(models.Class).filter(models.Class.name == "25CSEC").first()
    print(f"Class 25CSEC ID: {c_csec.id}")
    
    # Get Sanjay User ID
    u_sanjay = db.query(models.User).filter(models.User.email == "sanjay.krishna@attmate.com").first()
    print(f"Sanjay User ID: {u_sanjay.id}")
    
    print("\n[TEST 1] Regular Faculty Access (Sanjay -> 25CSEC)")
    response = client.get(f"/teacher/class-stats/{c_csec.id}?user_id={u_sanjay.id}")
    if response.status_code != 200:
        print(f"FAILED: {response.status_code} - {response.text}")
    else:
        data = response.json()
        print(f"Result Subjects: {len(data['subjects'])}")
        for s in data['subjects']:
            print(f" - {s['name']}")
            
    # 2. Find an Advisor
    print("\n[TEST 2] Advisor Access")
    # Who is advisor for 25CSEC?
    advisor_id = c_csec.advisor_id
    if not advisor_id:
        print("No advisor for 25CSEC. Finding any class with advisor...")
        cls_advisor = db.query(models.Class).filter(models.Class.advisor_id != None).first()
        if cls_advisor:
            print(f"Using Class: {cls_advisor.name} (Advisor ID: {cls_advisor.advisor_id})")
            advisor = db.query(models.Faculty).filter(models.Faculty.id == cls_advisor.advisor_id).first()
            u_advisor = db.query(models.User).filter(models.User.id == advisor.user_id).first()
            print(f"Advisor User: {u_advisor.email} (ID: {u_advisor.id})")
            
            response = client.get(f"/teacher/class-stats/{cls_advisor.id}?user_id={u_advisor.id}")
            data = response.json()
            print(f"Result Subjects: {len(data['subjects'])}")
            for s in data['subjects']:
                print(f" - {s['name']}")
        else:
            print("No advisors found in DB!")
            
    db.close()

if __name__ == "__main__":
    test_stats_logic()
