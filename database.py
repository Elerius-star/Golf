import sqlite3
from datetime import datetime
from typing import List, Optional
import json
from contextlib import contextmanager
import os

class Product:
    def __init__(self, id: int = None, name: str = "", price: str = "", 
                 category: str = "", description: str = "", stock: int = 0):
        self.id = id
        self.name = name
        self.price = price
        self.category = category
        self.description = description
        self.stock = stock
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "category": self.category,
            "description": self.description,
            "stock": self.stock
        }

class QueryHistory:
    def __init__(self, id: int = None, query_text: str = "", 
                 timestamp: str = "", response_count: int = 0):
        self.id = id
        self.query_text = query_text
        self.timestamp = timestamp
        self.response_count = response_count
    
    def to_dict(self):
        return {
            "id": self.id,
            "query": self.query_text,
            "timestamp": self.timestamp,
            "response_count": self.response_count
        }

class DatabaseManager:
    def __init__(self, db_path: str = "products.db"):
        self.db_path = db_path
        self.connection = None
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def check_connection(self):
        """Check if database connection works"""
        try:
            with self.get_connection() as conn:
                conn.execute("SELECT 1")
            return True
        except:
            return False
    
    def initialize_database(self):
        """Create database tables if they don't exist"""
        with self.get_connection() as conn:
            # Products table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    price TEXT NOT NULL,
                    category TEXT NOT NULL,
                    description TEXT,
                    stock INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Query history table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS query_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query_text TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    response_count INTEGER DEFAULT 0
                )
            """)
    
    def seed_sample_data(self):
        """Add sample products to database if empty"""
        with self.get_connection() as conn:
            # Check if products table is empty
            cursor = conn.execute("SELECT COUNT(*) as count FROM products")
            count = cursor.fetchone()["count"]
            
            if count == 0:
                sample_products = [
                    ("Wireless Bluetooth Headphones", "$99.99", "Electronics", 
                     "Noise-cancelling over-ear headphones", 50),
                    ("Smartphone X12 Pro", "$899.99", "Electronics", 
                     "Latest smartphone with 5G", 30),
                    ("Laptop UltraBook Pro", "$1299.99", "Electronics", 
                     "Lightweight laptop for professionals", 25),
                    ("Python Programming Guide", "$39.99", "Books", 
                     "Complete guide to Python programming", 100),
                    ("Machine Learning Basics", "$49.99", "Books", 
                     "Introduction to ML concepts", 75),
                    ("Cotton T-Shirt", "$19.99", "Clothing", 
                     "100% cotton comfortable t-shirt", 200),
                    ("Denim Jeans", "$59.99", "Clothing", 
                     "Classic blue denim jeans", 150),
                    ("Leather Sofa", "$799.99", "Home", 
                     "3-seater leather sofa", 15),
                    ("Coffee Table", "$149.99", "Home", 
                     "Modern wooden coffee table", 40),
                    ("Smart Watch Series 5", "$249.99", "Electronics", 
                     "Fitness tracking smartwatch", 60)
                ]
                
                conn.executemany("""
                    INSERT INTO products (name, price, category, description, stock)
                    VALUES (?, ?, ?, ?, ?)
                """, sample_products)
                
                print(f"Seeded {len(sample_products)} sample products")
    
    def get_all_products(self) -> List[Product]:
        """Get all products from database"""
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM products ORDER BY name")
            rows = cursor.fetchall()
            
            products = []
            for row in rows:
                products.append(Product(
                    id=row["id"],
                    name=row["name"],
                    price=row["price"],
                    category=row["category"],
                    description=row["description"],
                    stock=row["stock"]
                ))
            
            return products#
    
    def get_products_by_category(self, category: str) -> List[Product]:
        """Get products by category"""
        with self.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM products WHERE LOWER(category) = LOWER(?) ORDER BY name",
                (category,)
            )
            rows = cursor.fetchall()
            
            products = []
            for row in rows:
                products.append(Product(
                    id=row["id"],
                    name=row["name"],
                    price=row["price"],
                    category=row["category"],
                    description=row["description"],
                    stock=row["stock"]
                ))
            
            return products
    
    def search_products(self, search_term: str) -> List[Product]:
        """Search products by name or category"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM products 
                WHERE LOWER(name) LIKE ? 
                   OR LOWER(category) LIKE ? 
                   OR LOWER(description) LIKE ?
                ORDER BY name
            """, (f"%{search_term}%", f"%{search_term}%", f"%{search_term}%"))
            
            rows = cursor.fetchall()
            
            products = []
            for row in rows:
                products.append(Product(
                    id=row["id"],
                    name=row["name"],
                    price=row["price"],
                    category=row["category"],
                    description=row["description"],
                    stock=row["stock"]
                ))
            
            return products
    
    def log_query(self, query_text: str, response_count: int = 0) -> int:
        """Log a query to history and return its ID"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO query_history (query_text, response_count)
                VALUES (?, ?)
            """, (query_text, response_count))
            
            return cursor.lastrowid
    
    def update_query_response(self, query_id: int, response_count: int):
        """Update response count for a query"""
        with self.get_connection() as conn:
            conn.execute("""
                UPDATE query_history 
                SET response_count = ? 
                WHERE id = ?
            """, (response_count, query_id))
    
    def get_query_history(self, limit: int = 10) -> List[QueryHistory]:
        """Get recent query history"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM query_history 
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (limit,))
            
            rows = cursor.fetchall()
            
            history = []
            for row in rows:
                history.append(QueryHistory(
                    id=row["id"],
                    query_text=row["query_text"],
                    timestamp=row["timestamp"],
                    response_count=row["response_count"]
                ))
            
            return history