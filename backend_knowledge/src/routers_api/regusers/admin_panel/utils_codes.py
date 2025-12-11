# utils/codes.py
import secrets
import string
from datetime import datetime, timedelta

def generate_activation_code(length=8) -> str:
    """Генерация читаемого кода активации"""
    # Используем только буквы и цифры, исключаем похожие символы (0/O, 1/I/l)
    alphabet = string.ascii_uppercase.replace('O', '').replace('I', '') + \
               string.digits.replace('0', '').replace('1', '')
    
    # Группируем код для удобства чтения: XXXX-XXXX
    code = ''.join(secrets.choice(alphabet) for _ in range(length))
    return f"{code[:4]}-{code[4:]}"

def calculate_expiry_date(days=30) -> datetime:
    """Вычисление даты истечения"""
    return datetime.utcnow() + timedelta(days=days)

def validate_code_format(code: str) -> bool:
    """Проверка формата кода"""
    if len(code) != 9:  # XXXX-XXXX
        return False
    if code[4] != '-':
        return False
    return True