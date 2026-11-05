import re

def is_valid_email(email: str) -> bool:
    if not email or len(email) > 150:
        return False
    regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(regex, email))

def sanitize_string(val, max_len: int = 500) -> str:
    if not val:
        return ""
    val = str(val).strip()
    return val[:max_len]
