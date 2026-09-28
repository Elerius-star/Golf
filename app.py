#!/usr/bin/env python3
"""
Real-Time Chat Application Backend
Uses WebSockets for real-time communication and SQLite for data persistence
"""

import asyncio
import json
import sqlite3
import websockets
from datetime import datetime
from typing import Set, Dict
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ChatServer:
    def __init__(self):
        """Initialize the chat server"""
        self.clients: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.rooms: Dict[str, Set[str]] = {
            'general': set(),
            'tech': set(),
            'random': set()
        }
        self.user_rooms: Dict[str, str] = {}
        
        # Create database directory if it doesn't exist
        os.makedirs('database', exist_ok=True)
        
        self.init_database()
        
        # Pre-create default user: diamondelerius with password 123
        self.create_default_user()
        
        logger.info("=" * 50)
        logger.info("🚀 Toyota Chat Server Initialized")
        logger.info("=" * 50)

    def init_database(self):
        """Initialize SQLite database for chat history"""
        try:
            conn = sqlite3.connect('database/chat.db')
            cursor = conn.cursor()
            
            # Create users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_seen TIMESTAMP
                )
            ''')
            
            # Create messages table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    room TEXT NOT NULL,
                    content TEXT,
                    message_type TEXT DEFAULT 'text',
                    file_name TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create chat_rooms table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS chat_rooms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Insert default rooms
            default_rooms = [
                ('general', 'General discussion for everyone'),
                ('tech', 'Technology and programming discussions'),
                ('random', 'Random conversations and fun')
            ]
            
            for room_name, description in default_rooms:
                cursor.execute(
                    'INSERT OR IGNORE INTO chat_rooms (name, description) VALUES (?, ?)',
                    (room_name, description)
                )
            
            conn.commit()
            conn.close()
            logger.info("✅ Database initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Database initialization error: {e}")

    def create_default_user(self):
        """Create default user: diamondelerius with password 123"""
        try:
            conn = sqlite3.connect('database/chat.db')
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute('SELECT * FROM users WHERE username = ?', ('diamondelerius',))
            user = cursor.fetchone()
            
            if not user:
                # Create the default user
                cursor.execute(
                    'INSERT INTO users (username, password) VALUES (?, ?)',
                    ('diamondelerius', '123')
                )
                conn.commit()
                logger.info("✅ Default user created: diamondelerius / 123")
            else:
                logger.info("✅ Default user already exists: diamondelerius / 123")
            
            conn.close()
            
        except Exception as e:
            logger.error(f"Error creating default user: {e}")

    async def authenticate(self, username: str, password: str) -> bool:
        """Authenticate user credentials"""
        try:
            conn = sqlite3.connect('database/chat.db')
            cursor = conn.cursor()
            cursor.execute(
                'SELECT password FROM users WHERE username = ?',
                (username,)
            )
            result = cursor.fetchone()
            conn.close()
            
            if result:
                # Check password
                return result[0] == password
            else:
                # Auto-create new user
                conn = sqlite3.connect('database/chat.db')
                cursor = conn.cursor()
                cursor.execute(
                    'INSERT INTO users (username, password) VALUES (?, ?)',
                    (username, password)
                )
                conn.commit()
                conn.close()
                logger.info(f"✅ New user auto-created: {username}")
                return True
                
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return False

    async def register(self, websocket: websockets.WebSocketServerProtocol, username: str):
        """Register a new client connection"""
        try:
            # Check if user already exists with a connection
            if username in self.clients:
                try:
                    await self.clients[username].close()
                except:
                    pass
            
            self.clients[username] = websocket
            self.user_rooms[username] = 'general'
            
            if username not in self.rooms['general']:
                self.rooms['general'].add(username)
            
            # Update last seen in database
            try:
                conn = sqlite3.connect('database/chat.db')
                cursor = conn.cursor()
                cursor.execute(
                    'UPDATE users SET last_seen = ? WHERE username = ?',
                    (datetime.now(), username)
                )
                conn.commit()
                conn.close()
            except Exception as e:
                logger.error(f"Database update error: {e}")
            
            # Send welcome message
            welcome_message = {
                'type': 'system',
                'content': f'Welcome to Toyota Chat, {username}!',
                'timestamp': datetime.now().isoformat()
            }
            await websocket.send(json.dumps(welcome_message))
            
            # Notify all users about new user
            await self.broadcast({
                'type': 'user_joined',
                'username': username,
                'users': self.get_online_users(),
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"✅ User registered: {username} (Total: {len(self.clients)})")
            
        except Exception as e:
            logger.error(f"Error registering user {username}: {e}")

    async def unregister(self, username: str):
        """Unregister a client connection"""
        try:
            if username in self.clients:
                del self.clients[username]
                
                # Remove from rooms
                room = self.user_rooms.get(username, 'general')
                if room in self.rooms and username in self.rooms[room]:
                    self.rooms[room].discard(username)
                
                if username in self.user_rooms:
                    del self.user_rooms[username]
                
                # Notify all users
                await self.broadcast({
                    'type': 'user_left',
                    'username': username,
                    'users': self.get_online_users(),
                    'timestamp': datetime.now().isoformat()
                })
                
                logger.info(f"👋 User unregistered: {username} (Remaining: {len(self.clients)})")
                
        except Exception as e:
            logger.error(f"Error unregistering user {username}: {e}")

    def get_online_users(self) -> list:
        """Get list of online users"""
        return [
            {'username': username, 'status': 'online'}
            for username in self.clients.keys()
        ]

    async def broadcast(self, message: dict, room: str = None):
        """Broadcast message to all clients or specific room"""
        if room and room in self.rooms:
            # Broadcast to room only
            disconnected = []
            for username in self.rooms[room]:
                if username in self.clients:
                    try:
                        await self.clients[username].send(json.dumps(message))
                    except Exception as e:
                        logger.error(f"Broadcast error to {username}: {e}")
                        disconnected.append(username)
            
            # Clean up disconnected clients
            for username in disconnected:
                await self.unregister(username)
                
        else:
            # Broadcast to all
            disconnected = []
            for username, client in self.clients.items():
                try:
                    await client.send(json.dumps(message))
                except Exception as e:
                    logger.error(f"Broadcast error to {username}: {e}")
                    disconnected.append(username)
            
            # Clean up disconnected clients
            for username in disconnected:
                await self.unregister(username)

    async def save_message(self, username: str, room: str, content: dict):
        """Save message to database"""
        try:
            conn = sqlite3.connect('database/chat.db')
            cursor = conn.cursor()
            cursor.execute(
                '''INSERT INTO messages 
                   (username, room, content, message_type, file_name) 
                   VALUES (?, ?, ?, ?, ?)''',
                (
                    username,
                    room,
                    content.get('content', ''),
                    content.get('messageType', 'text'),
                    content.get('fileName', None)
                )
            )
            conn.commit()
            conn.close()
            logger.debug(f"Message saved: {username} in {room}")
        except Exception as e:
            logger.error(f"Error saving message: {e}")

    async def get_chat_history(self, room: str, limit: int = 50) -> list:
        """Retrieve chat history for a room"""
        try:
            conn = sqlite3.connect('database/chat.db')
            cursor = conn.cursor()
            cursor.execute(
                '''SELECT username, content, message_type, file_name, timestamp 
                   FROM messages 
                   WHERE room = ? 
                   ORDER BY timestamp DESC 
                   LIMIT ?''',
                (room, limit)
            )
            messages = cursor.fetchall()
            conn.close()
            
            history = []
            for msg in reversed(messages):
                try:
                    content = json.loads(msg[1]) if msg[1] and msg[1].startswith('{') else msg[1]
                except:
                    content = msg[1]
                    
                history.append({
                    'username': msg[0],
                    'content': content,
                    'type': msg[2] if msg[2] else 'text',
                    'fileName': msg[3],
                    'timestamp': msg[4]
                })
            
            return history
        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            return []

    async def handle_message(self, websocket: websockets.WebSocketServerProtocol, data: dict, username: str = None):
        """Handle incoming WebSocket messages"""
        try:
            message_type = data.get('type')
            
            if message_type == 'login':
                username = data.get('username')
                password = data.get('password', '')
                
                # Authenticate user
                is_authenticated = await self.authenticate(username, password)
                
                if is_authenticated:
                    await self.register(websocket, username)
                    await websocket.send(json.dumps({
                        'type': 'login_success',
                        'username': username,
                        'message': f'Login successful! Welcome {username}'
                    }))
                else:
                    await websocket.send(json.dumps({
                        'type': 'login_failed',
                        'message': 'Invalid credentials'
                    }))
                
            elif message_type == 'message' and username:
                chat_room = data.get('chatRoom', 'general')
                content = {
                    'content': data.get('content'),
                    'messageType': data.get('messageType', 'text'),
                    'fileName': data.get('fileName')
                }
                
                # Broadcast to room
                await self.broadcast({
                    'type': 'message',
                    'username': username,
                    'content': content['content'],
                    'messageType': content['messageType'],
                    'fileName': content['fileName'],
                    'timestamp': datetime.now().isoformat()
                }, room=chat_room)
                
                # Save to database
                await self.save_message(username, chat_room, content)
                
            elif message_type == 'join_room' and username:
                new_room = data.get('room')
                if new_room:
                    old_room = self.user_rooms.get(username, 'general')
                    
                    # Move user to new room
                    if old_room in self.rooms and username in self.rooms[old_room]:
                        self.rooms[old_room].discard(username)
                    
                    if new_room not in self.rooms:
                        self.rooms[new_room] = set()
                    
                    self.rooms[new_room].add(username)
                    self.user_rooms[username] = new_room
                    
                    logger.info(f"User {username} joined room: {new_room}")
                    
                    # Send room history
                    history = await self.get_chat_history(new_room)
                    await websocket.send(json.dumps({
                        'type': 'history',
                        'messages': history,
                        'room': new_room
                    }))
                    
            elif message_type == 'typing' and username:
                room = data.get('room', 'general')
                await self.broadcast({
                    'type': 'typing',
                    'username': username,
                    'is_typing': True
                }, room=room)
                
            elif message_type == 'stop_typing' and username:
                room = data.get('room', 'general')
                await self.broadcast({
                    'type': 'typing',
                    'username': username,
                    'is_typing': False
                }, room=room)
                
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            try:
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': str(e)
                }))
            except:
                pass

    async def handler(self, websocket: websockets.WebSocketServerProtocol, path: str):
        """Main WebSocket handler - FIXED: Now accepts path parameter"""
        username = None
        logger.info(f"🔌 New connection from {websocket.remote_address}")
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    logger.debug(f"📨 Received: {data.get('type')} from {data.get('username', 'unknown')}")
                    
                    # Extract username from login message
                    if data.get('type') == 'login':
                        username = data.get('username')
                    
                    await self.handle_message(websocket, data, username)
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON received: {e}")
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔌 Connection closed for user: {username}")
        except Exception as e:
            logger.error(f"Handler error: {e}")
        finally:
            if username:
                await self.unregister(username)

async def main():
    """Main function to start the server"""
    server = ChatServer()
    
    # Start WebSocket server with proper settings
    async with websockets.serve(
        server.handler, 
        "localhost", 
        8765,
        ping_interval=20,
        ping_timeout=60,
        max_size=10 * 1024 * 1024  # 10MB max message size
    ):
        logger.info("=" * 50)
        logger.info("🚀 Toyota Chat WebSocket Server Started!")
        logger.info(f"📡 Server running on: ws://localhost:8765")
        logger.info("💡 Waiting for connections...")
        logger.info("=" * 50)
        logger.info("🔐 Default Login: diamondelerius / 123")
        logger.info("=" * 50)
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n👋 Server shutting down...")
    except Exception as e:
        logger.error(f"Server error: {e}")