-- Sample test data for the chat application
-- Run this after initializing the database to populate with test data

-- Insert test users
INSERT OR IGNORE INTO users (username, email, password_hash, salt, display_name, status, created_at) VALUES
('alice', 'alice@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', 'Alice Wonder', 'online', datetime('now', '-5 days')),
('bob', 'bob@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', 'Bob Builder', 'online', datetime('now', '-3 days')),
('charlie', 'charlie@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', 'Charlie Brown', 'away', datetime('now', '-1 day')),
('diana', 'diana@example.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'salt123', 'Diana Prince', 'offline', datetime('now', '-7 days'));

-- Insert sample messages for general chat
INSERT OR IGNORE INTO messages (message_id, username, room, content, message_type, timestamp) VALUES
('msg1', 'alice', 'general', 'Hello everyone! Welcome to the chat!', 'text', datetime('now', '-2 hours')),
('msg2', 'bob', 'general', 'Thanks Alice! Great to be here.', 'text', datetime('now', '-115 minutes')),
('msg3', 'charlie', 'general', 'Has anyone tried the new features?', 'text', datetime('now', '-90 minutes')),
('msg4', 'alice', 'general', 'Yes, the file sharing works great!', 'text', datetime('now', '-60 minutes')),
('msg5', 'bob', 'general', 'I love the dark mode with Toyota colors!', 'text', datetime('now', '-30 minutes'));

-- Insert sample messages for tech chat
INSERT OR IGNORE INTO messages (message_id, username, room, content, message_type, timestamp) VALUES
('msg6', 'bob', 'tech', 'Anyone here using WebSockets?', 'text', datetime('now', '-3 hours')),
('msg7', 'charlie', 'tech', 'Yes, they are great for real-time apps!', 'text', datetime('now', '-170 minutes')),
('msg8', 'diana', 'tech', 'I prefer Server-Sent Events for some cases.', 'text', datetime('now', '-120 minutes')),
('msg9', 'bob', 'tech', 'What about scalability?', 'text', datetime('now', '-90 minutes'));

-- Insert private messages
INSERT OR IGNORE INTO private_messages (message_id, sender, receiver, content, message_type, timestamp) VALUES
('pm1', 'alice', 'bob', 'Hey Bob, want to collaborate on the project?', 'text', datetime('now', '-1 hour')),
('pm2', 'bob', 'alice', 'Sure Alice! When should we start?', 'text', datetime('now', '-55 minutes')),
('pm3', 'alice', 'bob', 'How about tomorrow at 10am?', 'text', datetime('now', '-50 minutes'));

-- Insert friend requests
INSERT OR IGNORE INTO friend_requests (from_user, to_user, status, created_at) VALUES
('alice', 'bob', 'accepted', datetime('now', '-2 days')),
('charlie', 'alice', 'pending', datetime('now', '-1 day'));

-- Insert friends
INSERT OR IGNORE INTO friends (user1, user2, created_at) VALUES
('alice', 'bob', datetime('now', '-2 days'));

-- Insert notifications
INSERT OR IGNORE INTO notifications (username, type, content, is_read, created_at) VALUES
('bob', 'friend_request', 'Alice sent you a friend request', 1, datetime('now', '-2 days')),
('alice', 'friend_accept', 'Bob accepted your friend request', 1, datetime('now', '-2 days')),
('charlie', 'message', 'New message in general chat', 0, datetime('now', '-1 hour'));

-- Create user-room associations
INSERT OR IGNORE INTO user_rooms (user_id, room_id, joined_at, last_read)
SELECT u.id, r.id, datetime('now'), datetime('now')
FROM users u, chat_rooms r
WHERE u.username IN ('alice', 'bob', 'charlie') 
  AND r.name IN ('general', 'tech');

-- Output summary
SELECT '✅ Test data inserted successfully!' as Result;
SELECT '📊 Total users: ' || COUNT(*) as Users FROM users;
SELECT '📊 Total messages: ' || COUNT(*) as Messages FROM messages;
SELECT '📊 Total private messages: ' || COUNT(*) as PrivateMessages FROM private_messages;