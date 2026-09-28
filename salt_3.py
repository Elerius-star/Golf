import hashlib
import os


#Assigning salting content
salt = os.urandom(16)
password_3 = "Admin123".encode()
salted_password_3 = salt + password_3

#Assigning hashing Algorithm
hashed_password_3 = hashlib.sha256(password_3).hexdigest()
hashed_salted_password_3 = hashlib.sha256(salted_password_3).hexdigest()


#usage
print(f"hashed_password; {hashed_password_3}")
print(f"hashed_salted_password; {hashed_salted_password_3}")