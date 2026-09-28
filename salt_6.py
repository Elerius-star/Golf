import hashlib
import os


#Assigning salting content
salt = os.urandom(16)
password_6 = "January".encode()
salted_password_6 = salt + password_6

#Assigning hashing Algorithm
hashed_password_6 = hashlib.sha256(password_6).hexdigest()
hashed_salted_password_6 = hashlib.sha256(salted_password_6).hexdigest()


#usage
print(f"hashed_password; {hashed_password_6}")
print(f"hashed_salted_password; {hashed_salted_password_6}")