"""
Configuration file for the chat application
Contains all settings and constants
"""

import os
from datetime import timedelta

class Config:
    """Base configuration class"""
    
    # Server settings
    HOST = 'localhost'
    PORT = 8765
    DEBUG = True
    
    # WebSocket settings
    MAX_MESSAGE_SIZE = 10 * 1024 * 1024  # 10MB
    PING_INTERVAL = 20  # seconds
    PING_TIMEOUT = 20  # seconds
    MAX_CONNECTIONS = 1000
    
    # Database settings
    DATABASE_PATH = 'database/chat.db'
    DATABASE_BACKUP_PATH = 'database/backups/'
    
    # Security settings
    SECRET_KEY = 'your-secret-key-here-change-in-production'
    SESSION_TIMEOUT = timedelta(days=7)
    PASSWORD_SALT_LENGTH = 32
    TOKEN_EXPIRY = timedelta(hours=24)
    
    # Rate limiting
    MESSAGES_PER_MINUTE = 60
    CONNECTIONS_PER_IP = 5
    
    # File upload settings
    UPLOAD_FOLDER = 'uploads/'
    ALLOWED_EXTENSIONS = {
        'images': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'],
        'documents': ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'],
        'audio': ['mp3', 'wav', 'ogg'],
        'video': ['mp4', 'webm', 'avi']
    }
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    
    # Chat settings
    MESSAGE_HISTORY_LIMIT = 100
    MAX_ROOM_NAME_LENGTH = 50
    MAX_USERNAME_LENGTH = 30
    MAX_MESSAGE_LENGTH = 5000
    
    # User presence
    PRESENCE_TIMEOUT = 300  # 5 minutes
    TYPING_TIMEOUT = 3  # seconds
    
    # Logging
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'logs/chat.log'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Notification settings
    NOTIFICATION_TYPES = [
        'message',
        'friend_request',
        'room_invite',
        'mention',
        'system'
    ]
    
    # Color scheme (matching frontend)
    COLORS = {
        'primary': '#2e7d32',  # Green
        'secondary': '#6a1b9a',  # Purple
        'accent': '#1a237e',  # Navy Blue
        'background': '#0a0a0a',  # Dark
        'text': '#ffffff',
        'text_muted': '#b0b0b0'
    }

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    HOST = '0.0.0.0'
    LOG_LEVEL = 'WARNING'
    SECRET_KEY = os.environ.get('SECRET_KEY', 'change-this-in-production')

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DATABASE_PATH = 'database/test_chat.db'
    DEBUG = True

# Select configuration based on environment
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get the current configuration"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])

# Create config instance
Config = get_config()