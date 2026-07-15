# seed.py
import sys
sys.path.append('.')
import secrets
import string

from database import SessionLocal
from models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_random_password(length=12):
    """Генерация случайного пароля"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def create_first_superadmin():
    """Создание первого суперадминистратора"""
    db = SessionLocal()
    
    try:
        # Проверяем, есть ли уже суперадмин
        superadmin_exists = db.query(User).filter(User.is_superadmin == True).first()
        
        if superadmin_exists:
            print("⚠️  Суперадминистратор уже существует!")
            print(f"   Email: {superadmin_exists.email}")
            return
        
        # Генерируем случайные данные
        random_suffix = secrets.token_hex(3)
        admin_email = f"superadmin_{random_suffix}@system.local"
        admin_username = f"superadmin_{random_suffix}"
        admin_password = generate_random_password()
        
        # Создаем суперадмина
        superadmin = User(
            email=admin_email,
            username=admin_username,
            hashed_password=pwd_context.hash(admin_password),
            is_active=True,      # Суперадмин активирован сразу
            is_admin=True,       # Является админом
            is_superadmin=True,  # Суперадмин
            is_banned=False
        )
        
        db.add(superadmin)
        db.commit()
        
        print("✅ Первый суперадминистратор создан!")
        print("=" * 50)
        print(f"Email:    {admin_email}")
        print(f"Username: {admin_username}")
        print(f"Password: {admin_password}")
        print("=" * 50)
        print("\n⚠️  Сохраните эти данные! Они покажутся только один раз!")
        print("⚠️  После первого входа смените email и пароль!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_first_superadmin()