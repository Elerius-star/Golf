import hashlib
import os


#Assigning salting content
salt = os.urandom(16)
password_5 = "Administrator".encode()
salted_password_5 = salt + password_5

#Assigning hashing Algorithm
hashed_password_5 = hashlib.sha256(password_5).hexdigest()
hashed_salted_password_5 = hashlib.sha256(salted_password_5).hexdigest()


#usage
print(f"hashed_password; {hashed_password_5}")
print(f"hashed_salted_password; {hashed_salted_password_5}")