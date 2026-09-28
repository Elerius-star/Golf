import sqlite3
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import contextmanager
import os

class DatabaseManager:
    def __init__(self, db_path: str = "products.db"):
        self.db_path = db_path
        self.init_database()
    
    @contextmanager
    def get_connection(self):
        """ACID-compliant database connection with transaction support"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        
        try:
            yield conn
            conn.commit()  # ATOMIC: All or nothing
        except Exception as e:
            conn.rollback()  # ATOMIC: Rollback on error
            raise e
        finally:
            conn.close()  # DURABLE: Changes persist
    
    def init_database(self):
        """Initialize database with ACID compliance"""
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
                    image_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(name, category)  -- CONSISTENCY: Prevent duplicates
                )
            """)
            
            # Query history table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS query_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query_text TEXT NOT NULL,
                    extracted_from_image BOOLEAN DEFAULT 0,
                    image_path TEXT,
                    response_count INTEGER DEFAULT 0,
                    confidence_score REAL,
                    processing_time REAL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Image uploads table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS image_uploads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    original_name TEXT,
                    file_size INTEGER,
                    mime_type TEXT,
                    upload_path TEXT NOT NULL,
                    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed BOOLEAN DEFAULT 0,
                    processing_time REAL
                )
            """)
            
            # Create indexes for performance (ISOLATION: Better concurrency)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_history_timestamp ON query_history(timestamp)")
    
    def seed_products(self):
        """Seed sample products"""
        sample_products = [
            ("Wireless Bluetooth Headphones", "$99.99", "Electronics", 
             "Noise-cancelling over-ear headphones", 50, "/products/headphones.jpg"),
            ("Smartphone X12 Pro", "$899.99", "Electronics", 
             "Latest smartphone with 5G", 30, "/products/phone.jpg"),
            ("Laptop UltraBook Pro", "$1299.99", "Electronics", 
             "Lightweight laptop for professionals", 25, "/products/laptop.jpg"),
            ("Python Programming Guide", "$39.99", "Books", 
             "Complete guide to Python programming", 100, "/books/python.jpg"),
            ("Machine Learning Basics", "$49.99", "Books", 
             "Introduction to ML concepts", 75, "/books/ml.jpg"),
            ("Cotton T-Shirt", "$19.99", "Clothing", 
             "100% cotton comfortable t-shirt", 200, "/clothing/tshirt.jpg"),
            ("Denim Jeans", "$59.99", "Clothing", 
             "Classic blue denim jeans", 150, "/clothing/jeans.jpg"),
            ("Leather Sofa", "$799.99", "Home", 
             "3-seater leather sofa", 15, "/home/sofa.jpg"),
            ("Coffee Table", "$149.99", "Home", 
             "Modern wooden coffee table", 40, "/home/table.jpg"),
            ("Smart Watch Series 5", "$249.99", "Electronics", 
             "Fitness tracking smartwatch", 60, "/products/watch.jpg"),
            ("Running Shoes", "$89.99", "Sports", 
             "Lightweight running shoes", 80, "/sports/shoes.jpg"),
            ("Yoga Mat", "$29.99", "Sports", 
             "Non-slip yoga mat", 120, "/sports/mat.jpg"),
            ("Digital Camera", "$499.99", "Electronics", 
             "24MP digital camera", 35, "/products/camera.jpg"),
            ("Cookbook Collection", "$49.99", "Books", 
             "Set of 5 recipe books", 45, "/books/cookbook.jpg"),
            ("Winter Jacket", "$129.99", "Clothing", 
             "Waterproof winter jacket", 60, "/clothing/jacket.jpg")
        ]
        
        with self.get_connection() as conn:
            # Check if products already exist
            cursor = conn.execute("SELECT COUNT(*) as count FROM products")
            if cursor.fetchone()["count"] == 0:
                conn.executemany("""
                    INSERT INTO products (name, price, category, description, stock, image_url)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, sample_products)
                print(f"Seeded {len(sample_products)} sample products")
    
    def log_query(self, query_text: str, extracted_from_image: bool = False, 
                  image_path: str = None, confidence: float = 0.0) -> int:
        """Log a query to history with ACID transaction"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO query_history 
                (query_text, extracted_from_image, image_path, confidence_score)
                VALUES (?, ?, ?, ?)
            """, (query_text, extracted_from_image, image_path, confidence))
            
            return cursor.lastrowid
    
    def update_query_response(self, query_id: int, response_count: int):
        """Update response count for a query"""
        with self.get_connection() as conn:
            conn.execute("""
                UPDATE query_history 
                SET response_count = ? 
                WHERE id = ?
            """, (response_count, query_id))
    
    def get_products_by_category(self, category: str) -> List[Dict]:
        """Get products by category"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM products 
                WHERE LOWER(category) = LOWER(?)
                ORDER BY name
            """, (category,))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def search_products(self, search_term: str) -> List[Dict]:
        """Search products by name, category, or description"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM products 
                WHERE LOWER(name) LIKE ? 
                   OR LOWER(category) LIKE ? 
                   OR LOWER(description) LIKE ?
                ORDER BY 
                    CASE 
                        WHEN LOWER(name) LIKE ? THEN 1
                        WHEN LOWER(category) LIKE ? THEN 2
                        ELSE 3
                    END,
                    name
            """, (f"%{search_term}%", f"%{search_term}%", f"%{search_term}%",
                  f"%{search_term}%", f"%{search_term}%"))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def get_all_products(self) -> List[Dict]:
        """Get all products"""
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM products ORDER BY name")
            return [dict(row) for row in cursor.fetchall()]
    
    def get_query_history(self, limit: int = 10) -> List[Dict]:
        """Get recent query history"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM query_history 
                ORDER BY timestamp DESC 
                LIMIT ?
            """, (limit,))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def save_image_upload(self, filename: str, original_name: str, 
                         file_size: int, mime_type: str, upload_path: str) -> int:
        """Save image upload record"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO image_uploads 
                (filename, original_name, file_size, mime_type, upload_path)
                VALUES (?, ?, ?, ?, ?)
            """, (filename, original_name, file_size, mime_type, upload_path))
            
            return cursor.lastrowid
    
    def mark_image_processed(self, upload_id: int, processing_time: float):
        """Mark image as processed"""
        with self.get_connection() as conn:
            conn.execute("""
                UPDATE image_uploads 
                SET processed = 1, processing_time = ?
                WHERE id = ?
            """, (processing_time, upload_id))