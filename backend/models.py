from sqlalchemy import Column, Integer, String, ForeignKey, Date, Boolean, Table
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    role = Column(String(20)) # 'admin' or 'teacher'

    faculty_profile = relationship("Faculty", back_populates="user", uselist=False)

class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    department = Column(String(100))

    user = relationship("User", back_populates="faculty_profile")
    assignments = relationship("FacultySubject", back_populates="faculty")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)

    assignments = relationship("FacultySubject", back_populates="subject")

class FacultySubject(Base):
    __tablename__ = "faculty_subjects"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    class_id = Column(Integer, ForeignKey("classes.id"))

    faculty = relationship("Faculty", back_populates="assignments")
    subject = relationship("Subject", back_populates="assignments")
    class_ = relationship("Class")

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    
    students = relationship("Student", back_populates="student_class")
    attendance_records = relationship("Attendance", back_populates="class_")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String(20), index=True)
    name = Column(String(100))
    class_id = Column(Integer, ForeignKey("classes.id"))

    student_class = relationship("Class", back_populates="students")
    attendance_records = relationship("Attendance", back_populates="student")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    status = Column(String(10)) # Present, Absent, OD
    student_id = Column(Integer, ForeignKey("students.id"))
    class_id = Column(Integer, ForeignKey("classes.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))

    student = relationship("Student", back_populates="attendance_records")
    class_ = relationship("Class", back_populates="attendance_records")
    subject = relationship("Subject")
