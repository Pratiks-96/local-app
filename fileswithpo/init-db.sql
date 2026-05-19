-- ═══════════════════════════════════════════════════════════
--  init-db.sql
--  Runs ONCE automatically when the postgres container starts
--  for the first time (when volume is empty)
--
--  Creates all tables that SQLAlchemy models expect
-- ═══════════════════════════════════════════════════════════

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50)  UNIQUE NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100),
    city            VARCHAR(100),
    area            VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster location queries
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_area ON users(area);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    city        VARCHAR(100),
    area        VARCHAR(100),
    creator_id  INTEGER NOT NULL REFERENCES users(id),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_city ON groups(city);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id         SERIAL PRIMARY KEY,
    title      VARCHAR(200) NOT NULL,
    content    TEXT NOT NULL,
    post_type  VARCHAR(50) DEFAULT 'general',
    city       VARCHAR(100),
    area       VARCHAR(100),
    author_id  INTEGER NOT NULL REFERENCES users(id),
    group_id   INTEGER REFERENCES groups(id),
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_posts_city      ON posts(city);
CREATE INDEX IF NOT EXISTS idx_posts_area      ON posts(area);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_type      ON posts(post_type);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id         SERIAL PRIMARY KEY,
    content    TEXT NOT NULL,
    post_id    INTEGER NOT NULL REFERENCES posts(id),
    author_id  INTEGER NOT NULL REFERENCES users(id),
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
    id         SERIAL PRIMARY KEY,
    post_id    INTEGER NOT NULL REFERENCES posts(id),
    user_id    INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)   -- one like per user per post
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);

-- Insert some seed data for testing
INSERT INTO users (username, email, hashed_password, full_name, city, area)
VALUES
  ('testuser', 'test@example.com',
   '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
   'Test User', 'Mumbai', 'Andheri')
ON CONFLICT (username) DO NOTHING;

-- Confirmation message
DO $$
BEGIN
  RAISE NOTICE '✅ Database initialized successfully!';
  RAISE NOTICE '   Tables: users, groups, posts, comments, likes';
  RAISE NOTICE '   Seed user: testuser / secret123';
END $$;
