from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())  # Output: gc5... (44 characters)