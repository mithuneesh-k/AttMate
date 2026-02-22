import sys
import os
sys.path.append(os.getcwd())
import models
from database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
columns = inspector.get_columns('attendance')
print('ATTENDANCE COLUMNS:')
for col in columns:
    print(f'- {col[''name'']} ({col[''type'']})')
