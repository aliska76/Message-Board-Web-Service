-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ==========================
-- Users table
-- ==========================

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- Messages table
-- ==========================

CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    authorId TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (authorId)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_messages_authorId ON messages(authorId);

-- ==========================
-- Votes table
-- ==========================

CREATE TABLE votes (
    id TEXT PRIMARY KEY,
    value INTEGER NOT NULL CHECK (value IN (-1, 1)),
    userId TEXT NOT NULL,
    messageId TEXT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (userId)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (messageId)
        REFERENCES messages(id)
        ON DELETE CASCADE,

    UNIQUE(userId, messageId)
);

CREATE INDEX idx_votes_messageId ON votes(messageId);
CREATE INDEX idx_votes_userId ON votes(userId);
