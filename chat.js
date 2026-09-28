// WebSocket Connection
let ws = null;
let currentUser = null;
let currentChat = 'general';
let selectedFile = null;
let notificationsEnabled = true;
let soundEnabled = true;
let soundGenerator = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectDelay = 3000;

// DOM Elements
const authSection = document.getElementById('authSection');
const chatSection = document.getElementById('chatSection');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const currentUserSpan = document.getElementById('currentUser');
const roomsList = document.getElementById('roomsList');
const usersList = document.getElementById('usersList');
const currentChatTitle = document.getElementById('currentChat');

// Initialize sound system
function initSoundSystem() {
    if (window.ToyotaSoundGenerator) {
        soundGenerator = new window.ToyotaSoundGenerator();
        console.log('✅ Sound system initialized');
        return true;
    } else {
        console.log('⚠️ Sound system not available');
        return false;
    }
}

// Play sound with error handling
function playSound(soundType) {
    if (!soundEnabled || !soundGenerator) return;
    
    try {
        switch(soundType) {
            case 'notification':
                soundGenerator.createNotificationSound();
                break;
            case 'sent':
                soundGenerator.createMessageSentSound();
                break;
            case 'received':
                soundGenerator.createMessageReceivedSound();
                break;
            case 'login':
                soundGenerator.createLoginSound();
                break;
            case 'error':
                soundGenerator.createErrorSound();
                break;
        }
    } catch (e) {
        console.log('Sound play failed:', e);
    }
}

// Setup WebSocket handlers after successful login
function setupWebSocketHandlers() {
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleIncomingMessage(data);
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    };
    
    ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        if (currentUser && !authSection.classList.contains('hidden')) {
            showNotification('Disconnected from server. Reconnecting...', 'error');
            playSound('error');
            
            // Attempt to reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const delay = reconnectDelay * reconnectAttempts;
                console.log(`Reconnecting in ${delay/1000} seconds... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
                setTimeout(() => {
                    if (currentUser) {
                        connectWebSocket();
                    }
                }, delay);
            } else {
                showNotification('Failed to reconnect. Please refresh the page.', 'error');
            }
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (currentUser) {
            showNotification('Connection error. Attempting to reconnect...', 'error');
        }
    };
}

// Initialize WebSocket connection for login
function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
    }
    
    console.log('Connecting to WebSocket server...');
    ws = new WebSocket('ws://localhost:8765');
    
    ws.onopen = () => {
        console.log('✅ Connected to WebSocket server');
        reconnectAttempts = 0;
        
        // Send login info if we have currentUser (for reconnection)
        if (currentUser) {
            ws.send(JSON.stringify({
                type: 'login',
                username: currentUser,
                password: localStorage.getItem('chatPassword') || ''
            }));
        }
    };
    
    // Initial onmessage handler for login response
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Login response:', data);
            
            if (data.type === 'login_success') {
                // Login successful
                showNotification(data.message, 'success');
                playSound('login');
                
                // Store user in localStorage
                localStorage.setItem('chatUser', currentUser);
                localStorage.setItem('chatPassword', document.getElementById('password').value);
                
                // Set up full WebSocket handlers
                setupWebSocketHandlers();
                
                // Request to join general room
                ws.send(JSON.stringify({
                    type: 'join_room',
                    room: 'general',
                    username: currentUser
                }));
                
            } else if (data.type === 'login_failed') {
                // Login failed
                showNotification(data.message || 'Invalid username or password', 'error');
                playSound('error');
                
                // Reset UI
                const loginBtn = document.querySelector('.btn-primary');
                if (loginBtn) {
                    loginBtn.textContent = 'Login';
                    loginBtn.disabled = false;
                }
                
                // Close the connection
                ws.close();
                ws = null;
                
                // Show auth section again if hidden
                if (authSection.classList.contains('hidden')) {
                    authSection.classList.remove('hidden');
                    chatSection.classList.add('hidden');
                }
                
                // Clear current user
                currentUser = null;
                currentUserSpan.textContent = '';
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    };
    
    ws.onclose = () => {
        console.log('WebSocket connection closed during login');
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error during login:', error);
        showNotification('Connection error. Make sure backend is running.', 'error');
        
        // Reset login button
        const loginBtn = document.querySelector('.btn-primary');
        if (loginBtn) {
            loginBtn.textContent = 'Login';
            loginBtn.disabled = false;
        }
    };
}

// Handle incoming messages (after login)
function handleIncomingMessage(data) {
    console.log('Received:', data.type);
    
    switch(data.type) {
        case 'system':
            showNotification(data.content, 'info');
            break;
            
        case 'message':
            displayMessage(data);
            if (data.username !== currentUser) {
                playSound('received');
                if (notificationsEnabled) {
                    showNotification(`New message from ${data.username}`, 'info');
                }
            } else {
                playSound('sent');
            }
            break;
            
        case 'user_joined':
            updateUsersList(data.users);
            showNotification(`${data.username} joined the chat`, 'info');
            playSound('notification');
            break;
            
        case 'user_left':
            updateUsersList(data.users);
            showNotification(`${data.username} left the chat`, 'info');
            break;
            
        case 'history':
            displayChatHistory(data.messages);
            break;
            
        case 'typing':
            if (data.is_typing) {
                showTypingIndicator(data.username);
            } else {
                hideTypingIndicator(data.username);
            }
            break;
            
        case 'error':
            showNotification(data.message, 'error');
            playSound('error');
            break;
    }
}

// Display a message
function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.username === currentUser ? 'sent' : 'received'}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let contentHtml = '';
    if (message.messageType === 'text' || message.type === 'text') {
        contentHtml = `<p>${escapeHtml(message.content)}</p>`;
    } else if (message.messageType === 'image' || message.type === 'image') {
        contentHtml = `<img src="${message.content}" alt="Shared image" class="message-image" onclick="openImage('${message.content}')">`;
    } else if (message.messageType === 'file' || message.type === 'file') {
        contentHtml = `
            <a href="${message.content}" class="message-file" download>
                <i class="fas fa-file"></i>
                <span>${escapeHtml(message.fileName || 'Download file')}</span>
            </a>
        `;
    }
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${escapeHtml(message.username)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">
            ${contentHtml}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Display chat history
function displayChatHistory(messages) {
    messagesContainer.innerHTML = '';
    if (!messages || messages.length === 0) {
        // Display welcome message if no history
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'message received';
        welcomeDiv.innerHTML = `
            <div class="message-content">
                <p>✨ Welcome to Toyota Chat! Start a conversation...</p>
            </div>
        `;
        messagesContainer.appendChild(welcomeDiv);
        return;
    }
    
    messages.forEach(message => displayMessage(message));
}

// Typing indicator management
let typingIndicators = {};

function showTypingIndicator(username) {
    if (username === currentUser) return;
    
    // Remove existing indicator for this user
    hideTypingIndicator(username);
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = `typing-${username}`;
    indicator.innerHTML = `
        <span></span><span></span><span></span>
        <span class="typing-text">${escapeHtml(username)} is typing...</span>
    `;
    
    messagesContainer.appendChild(indicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    typingIndicators[username] = indicator;
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        hideTypingIndicator(username);
    }, 3000);
}

function hideTypingIndicator(username) {
    const indicator = document.getElementById(`typing-${username}`);
    if (indicator) {
        indicator.remove();
        delete typingIndicators[username];
    }
}

// Authentication functions - FIXED VERSION
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showNotification('Please enter username and password', 'error');
        playSound('error');
        return;
    }
    
    // Store for later use
    currentUser = username;
    currentUserSpan.textContent = username;
    
    // Show loading state
    const loginBtn = document.querySelector('.btn-primary');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;
    
    // Close any existing connection
    if (ws) {
        try {
            ws.close();
        } catch(e) {}
        ws = null;
    }
    
    // Create new WebSocket connection
    ws = new WebSocket('ws://localhost:8765');
    
    ws.onopen = () => {
        console.log('Connected, sending login credentials...');
        // Send login credentials with password
        ws.send(JSON.stringify({
            type: 'login',
            username: username,
            password: password
        }));
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Login response:', data);
            
            if (data.type === 'login_success') {
                // Login successful
                showNotification(data.message, 'success');
                playSound('login');
                
                // Hide auth section, show chat section
                authSection.classList.add('hidden');
                chatSection.classList.remove('hidden');
                
                // Store user in localStorage
                localStorage.setItem('chatUser', username);
                localStorage.setItem('chatPassword', password);
                
                // Set up full WebSocket handlers
                setupWebSocketHandlers();
                
                // Request to join general room
                ws.send(JSON.stringify({
                    type: 'join_room',
                    room: 'general',
                    username: username
                }));
                
                // Reset login button
                loginBtn.textContent = originalText;
                loginBtn.disabled = false;
                
            } else if (data.type === 'login_failed') {
                // Login failed
                showNotification(data.message || 'Invalid username or password', 'error');
                playSound('error');
                
                // Reset login button
                loginBtn.textContent = originalText;
                loginBtn.disabled = false;
                
                // Close the connection
                ws.close();
                ws = null;
                
                // Clear current user
                currentUser = null;
                currentUserSpan.textContent = '';
            }
        } catch (e) {
            console.error('Error parsing message:', e);
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showNotification('Connection error. Make sure backend is running.', 'error');
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    };
    
    ws.onclose = () => {
        if (currentUser && !authSection.classList.contains('hidden')) {
            // Only show if not logged in successfully
            console.log('Connection closed during login');
        }
    };
}

function register() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showNotification('Please enter username and password', 'error');
        playSound('error');
        return;
    }
    
    // For registration, we'll use the same login process
    // The backend will auto-create new users
    showNotification('Registration successful! Logging you in...', 'success');
    playSound('login');
    
    // Automatically login after registration
    setTimeout(() => {
        login();
    }, 500);
}

// Chat functions
function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message && !selectedFile) {
        return;
    }
    
    if (selectedFile) {
        uploadFile(selectedFile);
    } else {
        const messageData = {
            type: 'message',
            username: currentUser,
            content: message,
            chatRoom: currentChat,
            timestamp: new Date().toISOString(),
            messageType: 'text'
        };
        
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(messageData));
            // Display message optimistically
            displayMessage({
                ...messageData,
                type: 'message'
            });
        } else {
            showNotification('Not connected to server', 'error');
        }
    }
    
    messageInput.value = '';
    
    // Stop typing indicator
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'stop_typing',
            username: currentUser,
            room: currentChat
        }));
    }
}

let typingTimeout;
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    } else if (event.key !== 'Enter') {
        // Send typing indicator
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'typing',
                username: currentUser,
                room: currentChat
            }));
            
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'stop_typing',
                        username: currentUser,
                        room: currentChat
                    }));
                }
            }, 2000);
        }
    }
}

function joinRoom(roomName) {
    currentChat = roomName;
    currentChatTitle.textContent = `${roomName} Chat`;
    
    // Update active room
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate the clicked room
    const roomItems = document.querySelectorAll('.room-item');
    for (let item of roomItems) {
        if (item.textContent.includes(roomName)) {
            item.classList.add('active');
            break;
        }
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'join_room',
            room: roomName,
            username: currentUser
        }));
    }
}

function createRoom() {
    const roomName = prompt('Enter room name:');
    if (roomName && roomName.trim()) {
        const sanitizedName = roomName.trim().toLowerCase().replace(/\s+/g, '_');
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-item';
        roomDiv.onclick = () => joinRoom(sanitizedName);
        roomDiv.innerHTML = `
            <i class="fas fa-hashtag"></i> ${escapeHtml(sanitizedName)}
            <span class="user-count">0</span>
        `;
        roomsList.appendChild(roomDiv);
        showNotification(`Room ${sanitizedName} created!`, 'success');
        playSound('notification');
    }
}

function showChatrooms() {
    roomsList.classList.remove('hidden');
    usersList.classList.add('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
}

function showPrivateChats() {
    roomsList.classList.add('hidden');
    usersList.classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
}

// File handling
function attachFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx,.txt';
    input.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
            selectedFile = e.target.files[0];
            document.getElementById('fileName').textContent = selectedFile.name;
            document.getElementById('filePreview').classList.remove('hidden');
            playSound('notification');
        }
    };
    input.click();
}

function clearFile() {
    selectedFile = null;
    document.getElementById('filePreview').classList.add('hidden');
}

function uploadFile(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const messageData = {
            type: 'message',
            username: currentUser,
            content: e.target.result,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            chatRoom: currentChat,
            timestamp: new Date().toISOString(),
            messageType: file.type.startsWith('image/') ? 'image' : 'file'
        };
        
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(messageData));
        }
        
        displayMessage({
            ...messageData,
            type: 'message'
        });
        
        clearFile();
        playSound('sent');
    };
    
    reader.onerror = () => {
        showNotification('File upload failed', 'error');
        playSound('error');
    };
    
    if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
    } else {
        showNotification('File upload for documents coming soon!', 'info');
        playSound('notification');
        clearFile();
    }
}

// User management
function updateUsersList(users) {
    if (!usersList) return;
    usersList.innerHTML = '<h3>Online Users</h3>';
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = `user-item ${user.status || 'online'}`;
        userDiv.innerHTML = `
            <i class="fas fa-circle"></i> ${escapeHtml(user.username)}
        `;
        userDiv.onclick = () => startPrivateChat(user.username);
        usersList.appendChild(userDiv);
    });
}

function startPrivateChat(username) {
    currentChat = `private_${username}`;
    currentChatTitle.textContent = `Chat with ${username}`;
    showNotification(`Started private chat with ${username}`, 'info');
    playSound('notification');
}

// Notifications
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                         type === 'error' ? 'fa-exclamation-circle' : 
                         'fa-info-circle'}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function toggleNotifications() {
    notificationsEnabled = !notificationsEnabled;
    showNotification(
        notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled',
        'info'
    );
    playSound('notification');
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    showNotification(
        soundEnabled ? 'Sound effects enabled' : 'Sound effects disabled',
        'info'
    );
    if (soundEnabled) playSound('notification');
}

function openImage(src) {
    window.open(src, '_blank');
}

function logout() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
    }
    currentUser = null;
    authSection.classList.remove('hidden');
    chatSection.classList.add('hidden');
    messagesContainer.innerHTML = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    localStorage.removeItem('chatUser');
    localStorage.removeItem('chatPassword');
    showNotification('Logged out successfully', 'success');
    playSound('notification');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('chatUser');
    const storedPassword = localStorage.getItem('chatPassword');
    
    if (storedUser && storedPassword) {
        document.getElementById('username').value = storedUser;
        document.getElementById('password').value = storedPassword;
        // Auto-login if credentials exist
        setTimeout(() => {
            login();
        }, 500);
    }
    
    initSoundSystem();
    
    // Add sound toggle button to header if it doesn't exist
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.querySelector('.sound-toggle-btn')) {
        const soundBtn = document.createElement('button');
        soundBtn.className = 'btn-icon sound-toggle-btn';
        soundBtn.onclick = toggleSound;
        soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        soundBtn.setAttribute('data-tooltip', 'Toggle Sound');
        headerActions.insertBefore(soundBtn, headerActions.firstChild);
    }
    
    console.log('🎯 Toyota Chat loaded! Press Ctrl+K to focus message input');
    console.log('🔐 Default login: diamondelerius / 123');
});

// Error handling
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg, ' at ', url, ':', lineNo);
    showNotification('An error occurred. Check console.', 'error');
    playSound('error');
    return false;
};