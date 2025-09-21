from .database import engine, SessionLocal
from .models import Base, User
from .auth import get_password_hash

Base.metadata.create_all(bind=engine)

db = SessionLocal()
admin = db.query(User).filter(User.username=="admin").first()
if not admin:
    admin = User(username="admin", full_name="Administrator", hashed_password=get_password_hash("adminpass"), role="admin")
    db.add(admin)
    db.commit()
    print("Created admin user: admin / adminpass")
else:
    print("Admin exists")
