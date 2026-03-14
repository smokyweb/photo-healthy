-- Photo Healthy Database Schema
-- Run: mysql -u root -p < setup.sql

CREATE DATABASE IF NOT EXISTS photohealthy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE photohealthy;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR(255) NULL,
  subscription_status VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_url VARCHAR(500) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  challenge_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  photo1_url VARCHAR(500) NOT NULL,
  photo2_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_challenge (user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  user_id INT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password_hash, is_admin) VALUES
  ('Admin', 'admin@photohealthy.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample challenges
INSERT INTO challenges (title, description, cover_image_url, start_date, end_date, is_active) VALUES
  ('Healthy Breakfast', 'Share your most creative and healthy breakfast photo!', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', '2026-03-01', '2026-03-31', TRUE),
  ('Outdoor Fitness', 'Capture the beauty of exercising outdoors!', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600', '2026-03-15', '2026-04-15', TRUE),
  ('Mindfulness Moments', 'Show us your peaceful meditation or yoga moments.', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600', '2026-04-01', '2026-04-30', TRUE)
ON DUPLICATE KEY UPDATE title=title;
