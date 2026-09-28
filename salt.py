import hashlib
import os


#Assigning salting content
salt = os.urandom(16)
password = "Eleriusrex$".encode()
salted_password = salt + password

#Assigning hashing Algorithm
hashed_password = hashlib.sha256(password).hexdigest()
hashed_salted_password = hashlib.sha256(salted_password).hexdigest()


#usage
print(f"hashed_password; {hashed_password}")
print(f"hashed_salted_password; {hashed_salted_password}")