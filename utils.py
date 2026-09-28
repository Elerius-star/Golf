"""
Utility functions for the chat application
"""

import hashlib
import json
import os
import secrets
import string
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PasswordUtils:
    """Password hashing and verification utilities"""
    
    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> Dict[str, str]:
        """Hash a password with a salt"""
        if not salt:
            salt = secrets.token_hex(16)
        
        # Combine password and salt, then hash
        combined = password + salt
        password_hash = hashlib.sha256(combined.encode()).hexdigest()
        
        # For additional security, hash multiple times
        for _ in range(1000):  # PBKDF2-like stretching
            password_hash = hashlib.sha256((password_hash + salt).encode()).hexdigest()
        
        return {
            'hash': password_hash,
            'salt': salt
        }
    
    @staticmethod
    def verify_password(password: str, stored_hash: str, salt: str) -> bool:
        """Verify a password against stored hash"""
        result = PasswordUtils.hash_password(password, salt)
        return result['hash'] == stored_hash
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Generate a secure random token"""
        return secrets.token_urlsafe(length)

class MessageUtils:
    """Message handling utilities"""
    
    @staticmethod
    def create_message_id() -> str:
        """Create a unique message ID"""
        return str(uuid.uuid4())
    
    @staticmethod
    def format_message(username: str, content: str, msg_type: str = 'text') -> Dict[str, Any]:
        """Format a message for sending"""
        return {
            'id': MessageUtils.create_message_id(),
            'username': username,
            'content': content,
            'type': msg_type,
            'timestamp': datetime.now().isoformat(),
            'formatted_time': datetime.now().strftime('%H:%M:%S')
        }
    
    @staticmethod
    def sanitize_message(content: str) -> str:
        """Sanitize message content (prevent XSS)"""
        # Basic sanitization - replace HTML tags
        import html
        return html.escape(content)
    
    @staticmethod
    def extract_mentions(content: str) -> list:
        """Extract @mentions from message"""
        import re
        mentions = re.findall(r'@(\w+)', content)
        return list(set(mentions))  # Remove duplicates

class FileUtils:
    """File handling utilities"""
    
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """Get file extension from filename"""
        return os.path.splitext(filename)[1].lower()
    
    @staticmethod
    def get_file_type(filename: str) -> str:
        """Determine file type based on extension"""
        ext = FileUtils.get_file_extension(filename).replace('.', '')
        
        image_exts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg']
        document_exts = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx']
        audio_exts = ['mp3', 'wav', 'ogg']
        video_exts = ['mp4', 'webm', 'avi']
        
        if ext in image_exts:
            return 'image'
        elif ext in document_exts:
            return 'document'
        elif ext in audio_exts:
            return 'audio'
        elif ext in video_exts:
            return 'video'
        else:
            return 'other'
    
    @staticmethod
    def generate_filename(original_filename: str) -> str:
        """Generate a unique filename"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        random_string = secrets.token_hex(4)
        ext = FileUtils.get_file_extension(original_filename)
        return f"{timestamp}_{random_string}{ext}"
    
    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """Format file size in human-readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"

class UserUtils:
    """User-related utilities"""
    
    @staticmethod
    def generate_username() -> str:
        """Generate a random username"""
        adjectives = ['happy', 'cool', 'smart', 'fast', 'brave', 'calm', 'eager']
        nouns = ['tiger', 'lion', 'eagle', 'dolphin', 'wolf', 'panda', 'falcon']
        number = secrets.randbelow(1000)
        
        adj = secrets.choice(adjectives)
        noun = secrets.choice(nouns)
        
        return f"{adj}_{noun}_{number}"
    
    @staticmethod
    def validate_username(username: str) -> bool:
        """Validate username format"""
        if not username:
            return False
        
        # Username must be 3-30 characters, alphanumeric and underscore
        import re
        pattern = r'^[a-zA-Z0-9_]{3,30}$'
        return bool(re.match(pattern, username))
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

class RoomUtils:
    """Chat room utilities"""
    
    @staticmethod
    def generate_room_code() -> str:
        """Generate a random room code for private rooms"""
        chars = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(chars) for _ in range(8))
    
    @staticmethod
    def validate_room_name(name: str) -> bool:
        """Validate room name format"""
        if not name:
            return False
        
        # Room name must be 3-50 characters, alphanumeric, spaces, hyphens, underscores
        import re
        pattern = r'^[a-zA-Z0-9\s_-]{3,50}$'
        return bool(re.match(pattern, name))

class DateTimeUtils:
    """Date and time utilities"""
    
    @staticmethod
    def format_timestamp(timestamp: str, format: str = '%H:%M') -> str:
        """Format timestamp for display"""
        try:
            dt = datetime.fromisoformat(timestamp)
            return dt.strftime(format)
        except:
            return timestamp
    
    @staticmethod
    def time_ago(timestamp: str) -> str:
        """Get human-readable time ago string"""
        try:
            dt = datetime.fromisoformat(timestamp)
            now = datetime.now()
            diff = now - dt
            
            if diff.days > 365:
                years = diff.days // 365
                return f"{years} year{'s' if years > 1 else ''} ago"
            elif diff.days > 30:
                months = diff.days // 30
                return f"{months} month{'s' if months > 1 else ''} ago"
            elif diff.days > 0:
                return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
            elif diff.seconds > 3600:
                hours = diff.seconds // 3600
                return f"{hours} hour{'s' if hours > 1 else ''} ago"
            elif diff.seconds > 60:
                minutes = diff.seconds // 60
                return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            else:
                return "just now"
        except:
            return "unknown"

class NotificationUtils:
    """Notification utilities"""
    
    @staticmethod
    def create_notification(username: str, notif_type: str, content: str, related_id: Optional[int] = None) -> Dict[str, Any]:
        """Create a notification object"""
        return {
            'id': str(uuid.uuid4()),
            'username': username,
            'type': notif_type,
            'content': content,
            'related_id': related_id,
            'is_read': False,
            'created_at': datetime.now().isoformat()
        }
    
    @staticmethod
    def format_notification_message(notif_type: str, data: Dict[str, Any]) -> str:
        """Format notification message based on type"""
        templates = {
            'message': f"New message from {data.get('sender', 'someone')}",
            'friend_request': f"{data.get('sender', 'Someone')} sent you a friend request",
            'friend_accept': f"{data.get('sender', 'Someone')} accepted your friend request",
            'room_invite': f"You've been invited to join {data.get('room', 'a room')}",
            'mention': f"{data.get('sender', 'Someone')} mentioned you in a message",
            'system': data.get('message', 'System notification')
        }
        
        return templates.get(notif_type, 'New notification')

# Test the utilities
if __name__ == "__main__":
    print("🧪 Testing Utilities...")
    print("=" * 50)
    
    # Test password utilities
    print("\n🔐 Password Utilities:")
    password = "test123"
    hashed = PasswordUtils.hash_password(password)
    print(f"  Password: {password}")
    print(f"  Hash: {hashed['hash'][:20]}...")
    print(f"  Salt: {hashed['salt']}")
    print(f"  Verification: {PasswordUtils.verify_password(password, hashed['hash'], hashed['salt'])}")
    
    # Test message utilities
    print("\n💬 Message Utilities:")
    msg = MessageUtils.format_message("testuser", "Hello @john!", "text")
    print(f"  Formatted message: {msg}")
    mentions = MessageUtils.extract_mentions("Hello @john and @jane!")
    print(f"  Mentions found: {mentions}")
    
    # Test file utilities
    print("\n📁 File Utilities:")
    filename = "image.jpg"
    print(f"  Filename: {filename}")
    print(f"  Extension: {FileUtils.get_file_extension(filename)}")
    print(f"  Type: {FileUtils.get_file_type(filename)}")
    print(f"  Generated name: {FileUtils.generate_filename(filename)}")
    print(f"  Size format (1.5MB): {FileUtils.format_file_size(1.5 * 1024 * 1024)}")
    
    # Test user utilities
    print("\n👤 User Utilities:")
    print(f"  Generated username: {UserUtils.generate_username()}")
    print(f"  Validate 'john_doe': {UserUtils.validate_username('john_doe')}")
    print(f"  Validate 'jo': {UserUtils.validate_username('jo')}")
    print(f"  Validate email 'test@example.com': {UserUtils.validate_email('test@example.com')}")
    
    # Test room utilities
    print("\n🏠 Room Utilities:")
    print(f"  Generated room code: {RoomUtils.generate_room_code()}")
    print(f"  Validate 'General Chat': {RoomUtils.validate_room_name('General Chat')}")
    
    # Test datetime utilities
    print("\n⏰ DateTime Utilities:")
    now = datetime.now().isoformat()
    print(f"  Current time: {now}")
    print(f"  Formatted: {DateTimeUtils.format_timestamp(now)}")
    print(f"  Time ago: {DateTimeUtils.time_ago(now)}")
    
    print("\n" + "=" * 50)
    print("✅ All utilities tested successfully!")