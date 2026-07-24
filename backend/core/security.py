import os
from cryptography.fernet import Fernet

# In a real app, this should be stored securely in an environment variable.
# For local MVP, we generate one if it doesn't exist, or read from a local file.
KEY_FILE = "secret.key"

if os.path.exists(KEY_FILE):
    with open(KEY_FILE, "rb") as f:
        _ENCRYPTION_KEY = f.read()
else:
    _ENCRYPTION_KEY = Fernet.generate_key()
    with open(KEY_FILE, "wb") as f:
        f.write(_ENCRYPTION_KEY)

cipher_suite = Fernet(_ENCRYPTION_KEY)

def encrypt_data(data: str) -> bytes:
    if not data:
        return b""
    return cipher_suite.encrypt(data.encode('utf-8'))

def decrypt_data(encrypted_data: bytes) -> str:
    if not encrypted_data:
        return ""
    try:
        return cipher_suite.decrypt(encrypted_data).decode('utf-8')
    except Exception:
        return ""
