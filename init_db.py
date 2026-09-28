#!/usr/bin/env python3
"""
Database Initialization Script
Run this script to create and initialize the database
"""

import sqlite3
import os
import hashlib
import json
from datetime import datetime

def init_database():
    """Initialize the database with all required tables"""
    
    # Create database directory if it doesn't exist
    os.makedirs('database', exist_ok=True)
    
    # Connect to database (this will create it if it doesn't exist)
    conn = sqlite3.connect('database/chat.db')
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute('PRAGMA foreign_keys = ON')
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            display_name TEXT,
            avatar_url TEXT,
            status TEXT DEFAULT 'offline',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            theme_preference TEXT DEFAULT 'dark',
            notification_enabled BOOLEAN DEFAULT 1
        )
    ''')
    
    # Create chat_rooms table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_by TEXT,
            is_private BOOLEAN DEFAULT 0,
            password TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(username)
        )
    ''')
    
    # Create messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT UNIQUE,
            username TEXT NOT NULL,
            room TEXT NOT NULL,
            content TEXT,
            message_type TEXT DEFAULT 'text',
            file_name TEXT,
            file_size INTEGER,
            file_type TEXT,
            file_url TEXT,
            is_deleted BOOLEAN DEFAULT 0,
            is_edited BOOLEAN DEFAULT 0,
            edited_at TIMESTAMP,
            reply_to INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (username) REFERENCES users(username),
            FOREIGN KEY (room) REFERENCES chat_rooms(name),
            FOREIGN KEY (reply_to) REFERENCES messages(id)
        )
    ''')
    
    # Create private_messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS private_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT UNIQUE,
            sender TEXT NOT NULL,
            receiver TEXT NOT NULL,
            content TEXT,
            message_type TEXT DEFAULT 'text',
            file_name TEXT,
            file_size INTEGER,
            file_type TEXT,
            file_url TEXT,
            is_read BOOLEAN DEFAULT 0,
            read_at TIMESTAMP,
            is_deleted BOOLEAN DEFAULT 0,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender) REFERENCES users(username),
            FOREIGN KEY (receiver) REFERENCES users(username)
        )
    ''')
    
    # Create user_rooms table (for user-room associations)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_rooms (
            user_id INTEGER,
            room_id INTEGER,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_read TIMESTAMP,
            is_muted BOOLEAN DEFAULT 0,
            PRIMARY KEY (user_id, room_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
        )
    ''')
    
    # Create friend_requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS friend_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_user TEXT NOT NULL,
            to_user TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP,
            FOREIGN KEY (from_user) REFERENCES users(username),
            FOREIGN KEY (to_user) REFERENCES users(username)
        )
    ''')
    
    # Create friends table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS friends (
            user1 TEXT NOT NULL,
            user2 TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user1, user2),
            FOREIGN KEY (user1) REFERENCES users(username),
            FOREIGN KEY (user2) REFERENCES users(username)
        )
    ''')
    
    # Create notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            type TEXT NOT NULL,
            content TEXT,
            related_id INTEGER,
            is_read BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (username) REFERENCES users(username)
        )
    ''')
    
    # Create sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (username) REFERENCES users(username)
        )
    ''')
    
    # Create indexes for better performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_private_messages_receiver ON private_messages(receiver)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_notifications_username ON notifications(username)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username)')
    
    # Insert default chat rooms
    default_rooms = [
        ('general', 'General discussion for everyone', 'system'),
        ('tech', 'Technology and programming discussions', 'system'),
        ('random', 'Random conversations and fun', 'system'),
        ('support', 'Get help and support', 'system'),
        ('announcements', 'Important announcements', 'system')
    ]
    
    for room_name, description, created_by in default_rooms:
        try:
            cursor.execute('''
                INSERT OR IGNORE INTO chat_rooms (name, description, created_by)
                VALUES (?, ?, ?)
            ''', (room_name, description, created_by))
        except sqlite3.Error as e:
            print(f"Error inserting room {room_name}: {e}")
    
    # Create sample test user (for testing purposes)
    # In production, use proper password hashing!
    test_password = "password123"
    test_salt = "testsalt123"
    test_hash = hashlib.sha256((test_password + test_salt).encode()).hexdigest()
    
    try:
        cursor.execute('''
            INSERT OR IGNORE INTO users (username, email, password_hash, salt, display_name, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('testuser', 'test@example.com', test_hash, test_salt, 'Test User', 'online'))
    except sqlite3.Error as e:
        print(f"Error creating test user: {e}")
    
    # Commit changes
    conn.commit()
    
    # Verify tables were created
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("✅ Database initialized successfully!")
    print("📊 Created tables:")
    for table in tables:
        print(f"   - {table[0]}")
    
    # Close connection
    conn.close()
    
    return True

def backup_database():
    """Create a backup of the database"""
    import shutil
    from datetime import datetime
    
    backup_filename = f"database/backup_chat_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    shutil.copy2('database/chat.db', backup_filename)
    print(f"✅ Database backed up to {backup_filename}")
    return backup_filename

def reset_database(confirm=False):
    """Reset the database (delete and recreate)"""
    if not confirm:
        print("⚠️  This will delete all data! Use confirm=True to proceed.")
        return False
    
    if os.path.exists('database/chat.db'):
        os.remove('database/chat.db')
        print("🗑️  Old database deleted")
    
    init_database()
    print("✅ Database reset complete")
    return True

if __name__ == "__main__":
    print("🚀 Initializing Chat Application Database...")
    print("=" * 50)
    
    # Initialize database
    init_database()
    
    # Optional: Create a backup
    # backup_database()
    
    print("=" * 50)
    print("✨ Database setup complete!")
    print("💡 You can now run the chat server with: python app.py")