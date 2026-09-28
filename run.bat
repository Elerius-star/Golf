@echo off
title Toyota Chat Application
color 0A

echo 🚀 Starting Toyota Chat Application
echo ====================================

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+
    pause
    exit /b 1
)

:: Display Python version
echo ✅ Python is installed
python --version

:: Create virtual environment if it doesn't exist
echo.
echo 🔧 Setting up virtual environment...
if not exist venv (
    python -m venv venv
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)

:: Activate virtual environment
echo.
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat
echo ✅ Virtual environment activated

:: Install requirements
echo.
echo 📚 Installing dependencies...
if exist requirements.txt (
    pip install -r requirements.txt
) else (
    echo ⚠️  requirements.txt not found, installing basic dependencies...
    pip install websockets
)
echo ✅ Dependencies installed

:: Create necessary directories
echo.
echo 📁 Creating directories...
if not exist database mkdir database
if not exist logs mkdir logs
if not exist uploads mkdir uploads
if not exist database\backups mkdir database\backups
echo ✅ Directories created

:: Initialize database
echo.
echo 🗄️  Initializing database...
if exist init_db.py (
    python init_db.py
) else (
    echo ⚠️  init_db.py not found, creating minimal database...
    python -c "import sqlite3; conn = sqlite3.connect('database/chat.db'); conn.execute('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, username TEXT, room TEXT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)'); conn.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)'); conn.close(); print('✅ Minimal database created')"
)

:: Check if app.py exists
echo.
echo 🔍 Checking application files...
if not exist app.py (
    echo ❌ app.py not found in current directory
    echo 📁 Current directory: %cd%
    dir
    pause
    exit /b 1
)
echo ✅ app.py found

:: Start the server
echo.
echo 🎯 Starting WebSocket server...
echo 📡 Server will run on: ws://localhost:8765
echo ⏰ Press Ctrl+C to stop the server
echo.

python app.py

pause