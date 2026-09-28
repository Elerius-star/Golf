import hashlib
import os


#Assigning salting content
salt = os.urandom(16)
password_4 = "password123".encode()
salted_password_4 = salt + password_4

#Assigning hashing Algorithm
hashed_password_4 = hashlib.sha256(password_4).hexdigest()
hashed_salted_password_4 = hashlib.sha256(salted_password_4).hexdigest()


#usage
print(f"hashed_password; {hashed_password_4}")
print(f"hashed_salted_password; {hashed_salted_password_4}")