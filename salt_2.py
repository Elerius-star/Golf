import hashlib
import os


#Assigning salting content
salt = os.urandom(16)
password_2 = "backend123".encode()
salted_password_2 = salt + password_2

#Assigning hashing Algorithm
hashed_password_2 = hashlib.sha256(password_2).hexdigest()
hashed_salted_password_2 = hashlib.sha256(salted_password_2).hexdigest()


#usage
print(f"hashed_password; {hashed_password_2}")
print(f"hashed_salted_password; {hashed_salted_password_2}")