require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'photohealthy_jwt_secret_2026';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));  // Allow base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'dist-web')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  },
});

// MySQL connection pool
const dbConfig = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'photohealthy',
  waitForConnections: true,
  connectionLimit: 10,
};
// Use socket on Linux/cPanel, TCP on local dev
if (process.env.DB_SOCKET) {
  dbConfig.socketPath = process.env.DB_SOCKET;
} else if (process.env.DB_HOST) {
  dbConfig.host = process.env.DB_HOST;
} else {
  dbConfig.host = 'localhost';
}
const pool = mysql.createPool(dbConfig);

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
    next();
  });
};

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );

    const token = jwt.sign({ id: result.insertId, email, is_admin: false }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: result.insertId, name, email, avatar_url: null, is_admin: false, subscription_status: 'free', created_at: new Date().toISOString() } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, is_admin: !!user.is_admin }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url, is_admin: !!user.is_admin, subscription_status: user.subscription_status, created_at: user.created_at },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, avatar_url, is_admin, subscription_status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    const u = users[0];
    res.json({ user: { ...u, is_admin: !!u.is_admin } });
  } catch {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

app.put('/api/auth/profile', auth, async (req, res) => {
  try {
    const { name, avatar_url } = req.body;
    const updates = [];
    const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (avatar_url !== undefined) { updates.push('avatar_url = ?'); params.push(avatar_url); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Update failed' });
  }
});

// ==================== CHALLENGES ROUTES ====================

app.get('/api/challenges', async (req, res) => {
  try {
    const [challenges] = await pool.query('SELECT * FROM challenges ORDER BY created_at DESC');
    res.json({ challenges });
  } catch {
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

app.get('/api/challenges/:id', async (req, res) => {
  try {
    const [challenges] = await pool.query('SELECT * FROM challenges WHERE id = ?', [req.params.id]);
    if (challenges.length === 0) return res.status(404).json({ error: 'Challenge not found' });
    res.json({ challenge: challenges[0] });
  } catch {
    res.status(500).json({ error: 'Failed to fetch challenge' });
  }
});

app.post('/api/challenges', adminAuth, async (req, res) => {
  try {
    const { title, description, cover_image_url, start_date, end_date, is_active } = req.body;
    if (!title || !start_date || !end_date) return res.status(400).json({ error: 'Title and dates required' });

    const [result] = await pool.query(
      'INSERT INTO challenges (title, description, cover_image_url, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description || null, cover_image_url || null, start_date, end_date, is_active !== false]
    );
    res.json({ id: result.insertId, success: true });
  } catch {
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

app.put('/api/challenges/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, cover_image_url, start_date, end_date, is_active } = req.body;
    await pool.query(
      'UPDATE challenges SET title=?, description=?, cover_image_url=?, start_date=?, end_date=?, is_active=? WHERE id=?',
      [title, description, cover_image_url, start_date, end_date, is_active, req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update challenge' });
  }
});

app.delete('/api/challenges/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM challenges WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

// ==================== SUBMISSIONS ROUTES ====================

app.get('/api/submissions', async (req, res) => {
  try {
    let query = `
      SELECT s.*, u.name as user_name, c.title as challenge_title
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN challenges c ON s.challenge_id = c.id
    `;
    const params = [];
    if (req.query.challenge_id) {
      query += ' WHERE s.challenge_id = ?';
      params.push(req.query.challenge_id);
    }
    query += ' ORDER BY s.created_at DESC';
    const [submissions] = await pool.query(query, params);
    res.json({ submissions });
  } catch {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

app.get('/api/submissions/:id', async (req, res) => {
  try {
    const [submissions] = await pool.query(
      `SELECT s.*, u.name as user_name, c.title as challenge_title
       FROM submissions s JOIN users u ON s.user_id = u.id JOIN challenges c ON s.challenge_id = c.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (submissions.length === 0) return res.status(404).json({ error: 'Submission not found' });
    res.json({ submission: submissions[0] });
  } catch {
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

app.post('/api/submissions', auth, async (req, res) => {
  try {
    const { challenge_id, title, description, photo1_url, photo2_url } = req.body;
    if (!challenge_id || !title || !photo1_url) return res.status(400).json({ error: 'Challenge, title, and photo required' });

    // Check challenge exists and is active
    const [challenges] = await pool.query('SELECT * FROM challenges WHERE id = ? AND is_active = TRUE', [challenge_id]);
    if (challenges.length === 0) return res.status(400).json({ error: 'Challenge not found or inactive' });

    // Check if user already submitted
    const [existing] = await pool.query('SELECT id FROM submissions WHERE user_id = ? AND challenge_id = ?', [req.user.id, challenge_id]);
    if (existing.length > 0) return res.status(400).json({ error: 'You already submitted to this challenge' });

    const [result] = await pool.query(
      'INSERT INTO submissions (user_id, challenge_id, title, description, photo1_url, photo2_url) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, challenge_id, title, description || null, photo1_url, photo2_url || null]
    );
    res.json({ id: result.insertId, success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'You already submitted to this challenge' });
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

app.delete('/api/submissions/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM submissions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// ==================== COMMENTS ROUTES ====================

app.get('/api/comments', async (req, res) => {
  try {
    const { submission_id } = req.query;
    if (!submission_id) return res.status(400).json({ error: 'submission_id required' });
    const [comments] = await pool.query(
      'SELECT c.*, u.name as user_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.submission_id = ? ORDER BY c.created_at ASC',
      [submission_id]
    );
    res.json({ comments });
  } catch {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/comments', auth, async (req, res) => {
  try {
    const { submission_id, text } = req.body;
    if (!submission_id || !text) return res.status(400).json({ error: 'Submission ID and text required' });

    const [result] = await pool.query(
      'INSERT INTO comments (submission_id, user_id, text) VALUES (?, ?, ?)',
      [submission_id, req.user.id, text]
    );
    res.json({ id: result.insertId, success: true });
  } catch {
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

app.delete('/api/comments/:id', auth, async (req, res) => {
  try {
    // Allow admin or comment author to delete
    const [comments] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [req.params.id]);
    if (comments.length === 0) return res.status(404).json({ error: 'Comment not found' });

    if (comments[0].user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ==================== USERS ROUTES (ADMIN) ====================

app.get('/api/users', adminAuth, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, avatar_url, is_admin, subscription_status, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: users.map(u => ({ ...u, is_admin: !!u.is_admin })) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.put('/api/users/:id', adminAuth, async (req, res) => {
  try {
    const { is_admin, subscription_status } = req.body;
    const updates = [];
    const params = [];
    if (is_admin !== undefined) { updates.push('is_admin = ?'); params.push(is_admin); }
    if (subscription_status) { updates.push('subscription_status = ?'); params.push(subscription_status); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.params.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', adminAuth, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==================== FILE UPLOAD ====================

// Multipart upload (kept for compatibility)
app.post('/api/upload', auth, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });
});

// Base64 JSON upload (works on all hosts including LiteSpeed)
app.post('/api/upload-base64', auth, (req, res) => {
  try {
    const { data, type, name } = req.body;
    if (!data) return res.status(400).json({ error: 'No image data provided' });

    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
    const mimeType = type || 'image/jpeg';
    if (!allowedTypes.some(t => mimeType.startsWith('image/'))) {
      return res.status(400).json({ error: 'Only images are allowed' });
    }

    // Decode base64
    const base64Data = data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Check size (10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }

    // Generate filename
    const ext = name ? path.extname(name) : (mimeType.includes('png') ? '.png' : mimeType.includes('gif') ? '.gif' : mimeType.includes('webp') ? '.webp' : '.jpg');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, buffer);
    const url = `/uploads/${filename}`;
    res.json({ url });
  } catch (err) {
    console.error('Base64 upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ==================== STRIPE SUBSCRIPTION ====================

app.post('/api/subscribe', auth, async (req, res) => {
  try {
    // Stripe integration placeholder
    res.json({ message: 'Stripe integration coming soon', url: null });
  } catch {
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

// ==================== SPA FALLBACK ====================

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist-web', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ status: 'Photo Healthy API running', version: '0.1.0' });
  }
});

// Global error handler — always return JSON, never HTML
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Photo Healthy server running on port ${PORT}`);
});

