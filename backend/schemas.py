from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class UserBase(BaseModel):
    email: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        orm_mode = True

class FacultyBase(BaseModel):
    name: str
    department: str

class FacultyCreate(FacultyBase):
    user_id: int

class Faculty(FacultyBase):
    id: int
    user_id: int
    class Config:
        orm_mode = True

class SubjectBase(BaseModel):
    name: str

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: int
    class Config:
        orm_mode = True

class FacultySubjectBase(BaseModel):
    faculty_id: int
    subject_id: int
    class_id: int

class FacultySubjectCreate(FacultySubjectBase):
    pass

class FacultySubject(FacultySubjectBase):
    id: int
    class Config:
        orm_mode = True

class StudentBase(BaseModel):
    roll_number: str
    name: str

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: int
    class_id: int
    class Config:
        orm_mode = True

class ClassBase(BaseModel):
    name: str

class ClassCreate(ClassBase):
    pass

class Class(ClassBase):
    id: int
    students: List[Student] = []
    class Config:
        orm_mode = True

class AttendanceBase(BaseModel):
    date: date
    status: str
    student_id: int
    class_id: int
    subject_id: int

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    id: int
    class Config:
        orm_mode = True
