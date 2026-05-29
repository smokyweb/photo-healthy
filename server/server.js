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

// ── LiteSpeed method override middleware ───────────────────────────────────
// LiteSpeed blocks PATCH/PUT/DELETE through its reverse proxy.
// Frontend sends POST with X-HTTP-Method-Override header, server re-routes.
app.use((req, res, next) => {
  const override = req.headers['x-http-method-override'];
  if (req.method === 'POST' && override && ['PATCH', 'PUT', 'DELETE'].includes(override.toUpperCase())) {
    req.method = override.toUpperCase();
  }
  next();
});
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

const DEFAULT_TAXONOMY = {
  challenge_categories: [
    'Calm & Presence',
    'Movement & Energy',
    'Nature & Outdoors',
    'Home & Everyday Life',
    'Joy & Gratitude',
    'Connection & Community',
    'Creativity & Seeing Differently',
    'Strength & Resilience',
    'Reflection & Awareness',
    'Place & Exploration',
  ],
  feeling_categories: [
    'Joy',
    'Love / Connection',
    'Calm / Peace',
    'Interest / Curiosity',
    'Pride / Confidence',
    'Reflection',
    'Energy',
    'Anticipation',
    'Vulnerability',
    'Renewal',
  ],
  movement_categories: [
    'Active',
    'Subtle',
    'Gentle',
    'Energizing',
    'Grounded',
    'Fluid',
    'Playful',
    'Steady',
    'Expressive',
    'Restorative',
  ],
};

// â”€â”€ Safe ALTER TABLE helper (compatible with MySQL 5.7 which lacks IF NOT EXISTS) â”€â”€
async function safeAddColumn(table, column, definition) {
  try {
    const db = process.env.DB_NAME || 'photohealthy';
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?`,
      [db, table, column]
    );
    if (rows.length === 0) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`[DB] Added column ${table}.${column}`);
    }
  } catch (e) {
    console.error(`[DB] safeAddColumn ${table}.${column}: ${e.message}`);
  }
}

// â”€â”€ DB migrations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(async () => {
  try {
    const migrations = [
      // Reports table
      `CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reporter_id INT NOT NULL,
        type ENUM('submission','comment') NOT NULL,
        target_id INT NOT NULL,
        reason VARCHAR(500),
        status ENUM('pending','resolved','dismissed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      // Orders table
      `CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        stripe_session_id VARCHAR(255) UNIQUE,
        stripe_payment_intent VARCHAR(255),
        status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
        total_amount DECIMAL(10,2),
        currency VARCHAR(10) DEFAULT 'usd',
        items_json TEXT,
        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        tracking_number VARCHAR(255) NULL,
        fulfilled_at TIMESTAMP NULL,
        archived TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      // Products table
      `CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        category VARCHAR(100),
        sizes VARCHAR(255),
        stock INT DEFAULT NULL,
        image_url VARCHAR(500),
        emoji VARCHAR(10),
        badge VARCHAR(50),
        featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      // Admin-managed coupon and gift codes
      `CREATE TABLE IF NOT EXISTS discount_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(80) NOT NULL UNIQUE,
        kind ENUM('coupon','gift') DEFAULT 'coupon',
        discount_type ENUM('percent','amount') NOT NULL DEFAULT 'amount',
        value DECIMAL(10,2) NOT NULL DEFAULT 0,
        min_subtotal DECIMAL(10,2) NULL,
        max_uses INT NULL,
        used_count INT DEFAULT 0,
        starts_at DATETIME NULL,
        expires_at DATETIME NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_discount_codes_code (code),
        INDEX idx_discount_codes_kind (kind)
      )`,
      // Challenge bans table
      `CREATE TABLE IF NOT EXISTS challenge_bans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        challenge_id INT NOT NULL,
        banned_by INT NOT NULL,
        reason VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_ban (user_id, challenge_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
      )`,
      // User challenge enrollments
      `CREATE TABLE IF NOT EXISTS user_challenges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        challenge_id INT NOT NULL,
        status ENUM('active','completed') DEFAULT 'active',
        personal_end_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_challenge (user_id, challenge_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
      )`,
      // Likes table
      `CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        submission_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (user_id, submission_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
      )`,
      // Comments table
      `CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        submission_id INT NOT NULL,
        text TEXT NOT NULL,
        content TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
      )`,
      // Partner inquiries table
      `CREATE TABLE IF NOT EXISTS partner_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        partnership_type VARCHAR(50),
        message TEXT,
        status ENUM('new','contacted','active','declined') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      // App settings table (key-value store)
      `CREATE TABLE IF NOT EXISTS app_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      // Contact form submissions
      `CREATE TABLE IF NOT EXISTS contact_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status ENUM('new','read','replied') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      // User dashboard notifications
      `CREATE TABLE IF NOT EXISTS user_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read TINYINT(1) DEFAULT 0,
        related_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_notifications_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
    ];
    for (const sql of migrations) {
      await pool.query(sql).catch(() => {});
    }
    console.log('[DB] All migrations complete');

    // Safe column additions (MySQL 5.7 compatible)
    await safeAddColumn('challenges', 'category', 'VARCHAR(100) NULL');
    await safeAddColumn('challenges', 'feeling_category', 'VARCHAR(100) NULL');
    await safeAddColumn('challenges', 'movement_category', 'VARCHAR(100) NULL');
    await safeAddColumn('challenges', 'duration_days', 'INT DEFAULT 30');
    await safeAddColumn('challenges', 'partner_url', 'VARCHAR(500) NULL');
    await safeAddColumn('submissions', 'title', 'VARCHAR(200) NULL');
    await safeAddColumn('submissions', 'description', 'TEXT NULL');
    await safeAddColumn('submissions', 'miles_walked', 'DECIMAL(10,2) NULL');
    await safeAddColumn('submissions', 'photo2_url', 'VARCHAR(500) NULL');
    await safeAddColumn('submissions', 'photo3_url', 'VARCHAR(500) NULL');
    await safeAddColumn('submissions', 'photo4_url', 'VARCHAR(500) NULL');
    await safeAddColumn('user_challenges', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await safeAddColumn('comments', 'text', 'TEXT NULL');
    await safeAddColumn('users', 'total_miles', 'DECIMAL(10,2) DEFAULT 0');
    await safeAddColumn('users', 'is_suspended', 'BOOLEAN DEFAULT FALSE');
    await safeAddColumn('users', 'suspended_reason', 'VARCHAR(500) NULL');
    await safeAddColumn('users', 'bio', 'TEXT NULL');
    await safeAddColumn('users', 'location', 'VARCHAR(200) NULL');
    await safeAddColumn('users', 'website', 'VARCHAR(300) NULL');
    await safeAddColumn('users', 'phone', 'VARCHAR(50) NULL');
    await safeAddColumn('users', 'is_deleted', 'TINYINT(1) DEFAULT 0');
    await safeAddColumn('users', 'deleted_at', 'DATETIME NULL');
    await safeAddColumn('users', 'stripe_customer_id', 'VARCHAR(255) NULL');
    await safeAddColumn('users', 'stripe_subscription_id', 'VARCHAR(255) NULL');
    await safeAddColumn('users', 'subscription_ends_at', 'DATETIME NULL');
    await safeAddColumn('users', 'subscription_type', "ENUM('stripe','manual') DEFAULT 'stripe' NULL");
    await safeAddColumn('users', 'subscription_note', 'VARCHAR(255) NULL');
    // Backfill: existing active Stripe subscribers get subscription_type = 'stripe'
    await pool.query(
      `UPDATE users SET subscription_type = 'stripe' WHERE subscription_status = 'active' AND stripe_subscription_id IS NOT NULL AND subscription_type IS NULL`
    ).catch(() => {});
    // Backfill: active users with no Stripe sub (manually set) get subscription_type = 'manual'
    await pool.query(
      `UPDATE users SET subscription_type = 'manual' WHERE subscription_status = 'active' AND stripe_subscription_id IS NULL AND subscription_type IS NULL`
    ).catch(() => {});
    await safeAddColumn('challenges', 'photo_inspiration', 'VARCHAR(500) NULL');
    await safeAddColumn('challenges', 'reflection_prompt', 'VARCHAR(500) NULL');
    await safeAddColumn('challenges', 'start_time', 'VARCHAR(8) NULL');
    await safeAddColumn('challenges', 'end_time', 'VARCHAR(8) NULL');
    await safeAddColumn('challenges', 'tags', 'VARCHAR(500) NULL');
    await safeAddColumn('challenges', 'is_pro_only', 'BOOLEAN DEFAULT FALSE');
    await safeAddColumn('products', 'is_pro_only', 'BOOLEAN DEFAULT FALSE');
    await safeAddColumn('discount_codes', 'kind', "ENUM('coupon','gift') DEFAULT 'coupon'");
    await safeAddColumn('discount_codes', 'discount_type', "ENUM('percent','amount') NOT NULL DEFAULT 'amount'");
    await safeAddColumn('discount_codes', 'value', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
    await safeAddColumn('discount_codes', 'min_subtotal', 'DECIMAL(10,2) NULL');
    await safeAddColumn('discount_codes', 'max_uses', 'INT NULL');
    await safeAddColumn('discount_codes', 'used_count', 'INT DEFAULT 0');
    await safeAddColumn('discount_codes', 'starts_at', 'DATETIME NULL');
    await safeAddColumn('discount_codes', 'expires_at', 'DATETIME NULL');
    await safeAddColumn('discount_codes', 'is_active', 'TINYINT(1) DEFAULT 1');
    await safeAddColumn('users', 'last_login_at', 'DATETIME NULL');
    // Subscription history log
    await pool.query(`CREATE TABLE IF NOT EXISTS subscription_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      description VARCHAR(255),
      amount DECIMAL(10,2) NULL,
      created_at DATETIME DEFAULT NOW(),
      INDEX idx_sub_hist_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`).catch(() => {});
    // One-time backfill: enrich sparse items_json (only id+quantity) with product titles
    try {
      const [orders] = await pool.query(`SELECT id, items_json FROM orders WHERE items_json IS NOT NULL AND items_json != '[]'`);
      for (const order of orders) {
        try {
          const parsed = JSON.parse(order.items_json);
          if (!Array.isArray(parsed) || parsed.length === 0) continue;
          // If items already have title, skip
          if (parsed[0].title) continue;
          const ids = parsed.map(i => i.id).filter(Boolean);
          if (!ids.length) continue;
          const [products] = await pool.query(`SELECT id, title, price, emoji FROM products WHERE id IN (?)`, [ids]);
          const pm = {}; products.forEach(p => { pm[p.id] = p; });
          const enriched = parsed.map(i => ({
            id: i.id, title: pm[i.id]?.title || `Product #${i.id}`,
            price: pm[i.id]?.price ? parseFloat(pm[i.id].price) : null,
            quantity: i.quantity || 1, size: i.size || null, emoji: pm[i.id]?.emoji || null,
          }));
          await pool.query('UPDATE orders SET items_json = ? WHERE id = ?', [JSON.stringify(enriched), order.id]);
        } catch {}
      }
    } catch {}
    await safeAddColumn('users', 'subscription_started_at', 'DATETIME NULL');
    // Backfill subscription_started_at for existing active subs
    await pool.query(
      `UPDATE users SET subscription_started_at = COALESCE(subscription_started_at, NOW()) WHERE subscription_status = 'active' AND subscription_started_at IS NULL`
    ).catch(() => {});
    await safeAddColumn('orders', 'confirmation_sent', 'TINYINT(1) DEFAULT 0');
    await safeAddColumn('orders', 'bundle_id', 'VARCHAR(36) NULL');
    await safeAddColumn('orders', 'bundle_note', 'VARCHAR(255) NULL');
    await safeAddColumn('orders', 'customer_name', 'VARCHAR(255) NULL');
    await safeAddColumn('orders', 'stripe_payment_intent', 'VARCHAR(255) NULL');
    await safeAddColumn('orders', 'shipping_address_json', 'TEXT NULL');
    await safeAddColumn('orders', 'shipping_method', 'VARCHAR(100) NULL');
    await safeAddColumn('orders', 'tracking_number', 'VARCHAR(255) NULL');
    await safeAddColumn('orders', 'fulfilled_at', 'TIMESTAMP NULL');
    await safeAddColumn('orders', 'archived', 'TINYINT(1) DEFAULT 0');
    await safeAddColumn('orders', 'customer_name', 'VARCHAR(255) NULL');
    await safeAddColumn('user_notifications', 'related_id', 'INT NULL');

  } catch (e) {
    console.error('[DB] Migration error:', e.message);
  }
})();

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
  auth(req, res, async () => {
    if (req.user.is_admin || req.user.role === 'admin') return next();
    try {
      const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
      const dbUser = users[0];
      if (dbUser && (dbUser.is_admin || dbUser.role === 'admin')) {
        req.user.is_admin = true;
        req.user.role = 'admin';
        return next();
      }
    } catch (err) {
      console.error('[AdminAuth] Failed to verify admin status:', err.message);
    }
    return res.status(403).json({ error: 'Admin access required' });
  });
};

function optionalAuth(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function normalizeDiscountCode(code) {
  return String(code || '').trim().toUpperCase();
}

function parseNullableDate(value) {
  const clean = String(value || '').trim();
  return clean ? clean : null;
}

async function resolveDiscountCodes({ couponCode, giftCode, subtotalCents }) {
  const requested = [
    { kind: 'coupon', code: normalizeDiscountCode(couponCode) },
    { kind: 'gift', code: normalizeDiscountCode(giftCode) },
  ].filter(item => item.code);

  if (!requested.length) return { codes: [], discountCents: 0 };

  const seen = new Set();
  const codes = [];
  let discountCents = 0;
  const subtotal = subtotalCents / 100;

  for (const reqCode of requested) {
    const key = `${reqCode.kind}:${reqCode.code}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const [[code]] = await pool.query(
      `SELECT * FROM discount_codes WHERE code = ? AND kind = ? LIMIT 1`,
      [reqCode.code, reqCode.kind]
    );

    const label = reqCode.kind === 'gift' ? 'Gift code' : 'Coupon code';
    if (!code) throw new Error(`${label} "${reqCode.code}" was not found.`);
    if (!code.is_active) throw new Error(`${label} "${reqCode.code}" is not active.`);
    if (code.starts_at && new Date(code.starts_at) > new Date()) throw new Error(`${label} "${reqCode.code}" is not active yet.`);
    if (code.expires_at && new Date(code.expires_at) < new Date()) throw new Error(`${label} "${reqCode.code}" has expired.`);
    if (code.max_uses != null && Number(code.used_count || 0) >= Number(code.max_uses)) throw new Error(`${label} "${reqCode.code}" has reached its usage limit.`);
    if (code.min_subtotal != null && subtotal < Number(code.min_subtotal)) {
      throw new Error(`${label} "${reqCode.code}" requires a subtotal of at least $${Number(code.min_subtotal).toFixed(2)}.`);
    }

    const rawDiscount = code.discount_type === 'percent'
      ? Math.round(subtotalCents * (Number(code.value) / 100))
      : Math.round(Number(code.value) * 100);
    const cappedDiscount = Math.max(0, Math.min(rawDiscount, subtotalCents - discountCents));
    if (cappedDiscount <= 0) continue;
    discountCents += cappedDiscount;
    codes.push({ ...code, discount_cents: cappedDiscount });
  }

  return { codes, discountCents };
}

function applyDiscountToLineItems(lineItems, discountCents) {
  if (discountCents <= 0) return lineItems;

  const expanded = [];
  lineItems.forEach((li, index) => {
    const unitAmount = li.price_data.unit_amount;
    for (let i = 0; i < li.quantity; i++) expanded.push({ lineItem: li, index, unitAmount, discount: 0 });
  });

  const subtotalCents = expanded.reduce((sum, item) => sum + item.unitAmount, 0);
  if (!subtotalCents) return lineItems;

  let allocated = 0;
  expanded.forEach((item, idx) => {
    const share = idx === expanded.length - 1
      ? discountCents - allocated
      : Math.floor(discountCents * item.unitAmount / subtotalCents);
    item.discount = Math.min(item.unitAmount, Math.max(0, share));
    allocated += item.discount;
  });

  const adjusted = expanded.map(item => {
    const unitAmount = Math.max(0, item.unitAmount - item.discount);
    return {
      ...item.lineItem,
      quantity: 1,
      price_data: {
        ...item.lineItem.price_data,
        unit_amount: unitAmount,
      },
    };
  });

  return adjusted.filter(li => li.price_data.unit_amount > 0);
}

async function markDiscountCodesUsed(codes) {
  for (const code of codes) {
    await pool.query('UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?', [code.id]);
  }
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND COALESCE(is_deleted, 0) = 0', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );

    const token = jwt.sign({ id: result.insertId, email, is_admin: false, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: result.insertId, name, email, avatar_url: null, is_admin: false, role: 'user', subscription_status: 'free', created_at: new Date().toISOString() } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND COALESCE(is_deleted, 0) = 0', [email]);
    if (users.length === 0) return res.status(401).json({ error: 'Invalid id/password' });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid id/password' });

    const role = user.role || (user.is_admin ? 'admin' : 'user');
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: !!user.is_admin, role }, JWT_SECRET, { expiresIn: '30d' });
    // Track last login time
    pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]).catch(() => {});
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url, is_admin: !!user.is_admin, role, subscription_status: user.subscription_status, created_at: user.created_at },
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    let users;
    try {
      [users] = await pool.query('SELECT id, name, email, avatar_url, bio, location, website, phone, is_admin, role, subscription_status, total_miles, created_at FROM users WHERE id = ?', [req.user.id]);
    } catch (err) {
      if (err.code !== 'ER_BAD_FIELD_ERROR') throw err;
      [users] = await pool.query('SELECT id, name, email, avatar_url, bio, location, website, phone, is_admin, subscription_status, total_miles, created_at FROM users WHERE id = ?', [req.user.id]);
    }
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    const u = users[0];
    res.json({ user: { ...u, is_admin: !!u.is_admin, role: u.role || (u.is_admin ? 'admin' : 'user') } });
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

// Helper â€” log a subscription event
async function logSubEvent(userId, eventType, description, amount = null) {
  try {
    await pool.query(
      'INSERT INTO subscription_history (user_id, event_type, description, amount) VALUES (?, ?, ?, ?)',
      [userId, eventType, description, amount]
    );
  } catch {}
}

async function createUserNotification(userId, { type, title, message, relatedId = null }) {
  if (!userId) return;
  try {
    await pool.query(
      `INSERT INTO user_notifications (user_id, type, title, message, related_id)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, message || null, relatedId]
    );
  } catch (e) {
    console.error('[notification]', e.message);
  }
}

// GET /api/admin/users/:id/orders â€” all orders for a specific user
app.get('/api/admin/users/:id/orders', adminAuth, async (req, res) => {
  try {
    const [[u]] = await pool.query('SELECT email FROM users WHERE id = ?', [req.params.id]);
    if (!u) return res.status(404).json({ error: 'User not found' });
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE user_id = ? OR customer_email = ? ORDER BY created_at DESC`,
      [req.params.id, u.email]
    );
    res.json({ orders });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/users/:id/submissions - submissions for a specific user
app.get('/api/admin/users/:id/submissions', adminAuth, async (req, res) => {
  try {
    const [submissions] = await pool.query(
      `SELECT s.*,
              s.photo1_url as image_url,
              u.name as user_name,
              c.title as challenge_title,
              c.id as challenge_id,
              c.category as challenge_category,
              c.feeling_category as challenge_feeling_category,
              c.movement_category as challenge_movement_category,
              COALESCE((SELECT COUNT(*) FROM likes WHERE submission_id = s.id), 0) as like_count,
              COALESCE((SELECT COUNT(*) FROM comments WHERE submission_id = s.id), 0) as comment_count
       FROM submissions s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN challenges c ON s.challenge_id = c.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC
       LIMIT 200`,
      [req.params.id]
    );
    res.json({ submissions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/users/:id/comments - comments for a specific user
app.get('/api/admin/users/:id/comments', adminAuth, async (req, res) => {
  try {
    const [comments] = await pool.query(
      `SELECT cm.id,
              COALESCE(cm.text, cm.content) as text,
              cm.created_at,
              s.title as submission_title,
              s.id as submission_id,
              s.photo1_url as submission_photo,
              u.name as user_name
       FROM comments cm
       LEFT JOIN submissions s ON cm.submission_id = s.id
       LEFT JOIN users u ON cm.user_id = u.id
       WHERE cm.user_id = ?
       ORDER BY cm.created_at DESC
       LIMIT 300`,
      [req.params.id]
    );
    res.json({ comments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/activity - moderation timeline of all photos and comments
app.get('/api/admin/activity', adminAuth, async (req, res) => {
  try {
    const [items] = await pool.query(
      `(SELECT
          s.id,
          'submission' as type,
          s.title,
          s.description,
          s.photo1_url as image_url,
          s.photo1_url,
          s.photo2_url,
          s.photo3_url,
          s.photo4_url,
          s.created_at,
          s.user_id,
          u.name as user_name,
          c.title as challenge_title,
          c.id as challenge_id,
          c.category as challenge_category,
          c.feeling_category as challenge_feeling_category,
          c.movement_category as challenge_movement_category,
          NULL as submission_id,
          NULL as submission_title,
          COALESCE((SELECT COUNT(*) FROM likes WHERE submission_id = s.id), 0) as like_count,
          COALESCE((SELECT COUNT(*) FROM comments WHERE submission_id = s.id), 0) as comment_count
        FROM submissions s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN challenges c ON s.challenge_id = c.id)
       UNION ALL
       (SELECT
          cm.id,
          'comment' as type,
          cm.text as title,
          NULL as description,
          s.photo1_url as image_url,
          s.photo1_url,
          s.photo2_url,
          s.photo3_url,
          s.photo4_url,
          cm.created_at,
          cm.user_id,
          u.name as user_name,
          c.title as challenge_title,
          c.id as challenge_id,
          c.category as challenge_category,
          c.feeling_category as challenge_feeling_category,
          c.movement_category as challenge_movement_category,
          s.id as submission_id,
          s.title as submission_title,
          0 as like_count,
          0 as comment_count
        FROM comments cm
        LEFT JOIN users u ON cm.user_id = u.id
        LEFT JOIN submissions s ON cm.submission_id = s.id
        LEFT JOIN challenges c ON s.challenge_id = c.id)
       ORDER BY created_at DESC
       LIMIT 400`
    );
    res.json({ items });
  } catch (e) {
    console.error('[admin/activity]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/users/:id/subscription-history â€” membership event log
app.get('/api/admin/users/:id/subscription-history', adminAuth, async (req, res) => {
  try {
    const [events] = await pool.query(
      'SELECT * FROM subscription_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.params.id]
    );
    res.json({ events });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/submissions/:id/download â€” serve original (no watermark) to Pro subscribers who own the photo, or admins
app.get('/api/submissions/:id/download', auth, async (req, res) => {
  try {
    const photo = req.query.photo === '2' ? 'photo2_url' : 'photo1_url';
    const [[sub]] = await pool.query('SELECT user_id, photo1_url, photo2_url, title FROM submissions WHERE id = ?', [req.params.id]);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    // Must own the photo
    if (sub.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'You can only download your own photos' });
    }
    // Must be Pro subscriber (admins bypass this check)
    if (!req.user.is_admin) {
      const [[u]] = await pool.query('SELECT subscription_status FROM users WHERE id = ?', [req.user.id]);
      if (u?.subscription_status !== 'active') {
        return res.status(403).json({ error: 'pro_required', message: 'Upgrade to Pro to download your original photos.' });
      }
    }
    const url = sub[photo];
    if (!url) return res.status(404).json({ error: 'Photo not found' });
    res.redirect(url);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/me/access â€” returns what the current user can access
app.get('/api/users/me/access', auth, async (req, res) => {
  try {
    const [[u]] = await pool.query('SELECT subscription_status FROM users WHERE id = ?', [req.user.id]);
    const isPro = u?.subscription_status === 'active';
    // Count this month's submissions
    const [[{ monthCount }]] = await pool.query(
      `SELECT COUNT(*) as monthCount FROM submissions WHERE user_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
      [req.user.id]
    );
    res.json({
      isPro,
      canSubmit: isPro || monthCount < 50,
      monthlySubmissions: monthCount,
      monthlyLimit: isPro ? null : 50,
      remainingSubmissions: isPro ? null : Math.max(0, 50 - monthCount),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/me/stats â€” real profile stats for the logged-in user
app.get('/api/users/me/stats', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const [[u]] = await pool.query('SELECT total_miles FROM users WHERE id = ?', [uid]);
    const [subs] = await pool.query(
      'SELECT id, challenge_id, miles_walked, created_at FROM submissions WHERE user_id = ? ORDER BY created_at ASC',
      [uid]
    );
    const [likes] = await pool.query(
      'SELECT COUNT(*) as cnt FROM likes l JOIN submissions s ON l.submission_id = s.id WHERE s.user_id = ?',
      [uid]
    );

    // Unique challenges
    const challengeIds = new Set(subs.map((s) => s.challenge_id));

    // Day streak: consecutive days ending today or yesterday that have a submission
    const days = new Set(subs.map((s) => new Date(s.created_at).toISOString().slice(0, 10)));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (days.has(key)) streak++;
      else if (i > 0) break; // gap found (don't break on i=0 if today has no submission yet)
    }

    // Total miles: sum from submissions (fallback to users.total_miles)
    const milesFromSubs = subs.reduce((sum, s) => sum + (parseFloat(s.miles_walked) || 0), 0);
    const totalMiles = milesFromSubs || parseFloat(u?.total_miles) || 0;

    res.json({
      submissions: subs.length,
      challenges: challengeIds.size,
      streak,
      totalMiles: Math.round(totalMiles * 10) / 10,
      likesReceived: likes[0]?.cnt || 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/users/me/challenges - challenges grouped by this user's own progress
app.get('/api/users/me/challenges', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         uc.id,
         uc.challenge_id,
         uc.status,
         uc.personal_end_date,
         DATEDIFF(uc.personal_end_date, CURDATE()) AS days_remaining,
         c.title,
         c.cover_image_url,
         c.category,
         c.feeling_category,
         c.movement_category,
         c.duration_days,
         c.end_date,
        c.is_active,
        (SELECT COUNT(*)
         FROM submissions s
         WHERE s.challenge_id = uc.challenge_id
           AND s.user_id != uc.user_id
           AND s.created_at > uc.created_at) AS new_submission_count,
        EXISTS(
          SELECT 1 FROM submissions s
          WHERE s.user_id = uc.user_id AND s.challenge_id = uc.challenge_id
         ) AS has_submitted
       FROM user_challenges uc
       JOIN challenges c ON c.id = uc.challenge_id
       WHERE uc.user_id = ?
       ORDER BY uc.updated_at DESC, uc.created_at DESC`,
      [req.user.id]
    );

    const byChallenge = new Map(rows.map(row => [
      Number(row.challenge_id),
      {
        ...row,
        days_remaining: row.days_remaining == null ? null : Number(row.days_remaining),
        has_submitted: !!row.has_submitted,
        new_submission_count: Number(row.new_submission_count || 0),
        status: row.has_submitted ? 'completed' : row.status,
      },
    ]));

    const [submissionOnlyRows] = await pool.query(
      `SELECT
         s.challenge_id,
         MAX(s.created_at) AS submitted_at,
         c.title,
         c.cover_image_url,
         c.category,
         c.feeling_category,
         c.movement_category,
         c.duration_days,
         c.end_date,
         c.is_active
       FROM submissions s
       JOIN challenges c ON c.id = s.challenge_id
       LEFT JOIN user_challenges uc
         ON uc.user_id = s.user_id AND uc.challenge_id = s.challenge_id
       WHERE s.user_id = ? AND uc.id IS NULL
       GROUP BY s.challenge_id, c.title, c.cover_image_url, c.category, c.feeling_category, c.movement_category, c.duration_days, c.end_date, c.is_active`,
      [req.user.id]
    );

    submissionOnlyRows.forEach(row => {
      byChallenge.set(Number(row.challenge_id), {
        ...row,
        id: `submission-${row.challenge_id}`,
        status: 'completed',
        days_remaining: null,
        has_submitted: true,
      });
    });

    const all = Array.from(byChallenge.values());
    const active = all.filter(item =>
      item.status === 'active' &&
      !item.has_submitted &&
      Number(item.is_active) !== 0 &&
      !(item.end_date && new Date(item.end_date).getTime() < Date.now()) &&
      (item.days_remaining == null || Number(item.days_remaining) >= 0)
    );
    const past = all.filter(item =>
      item.has_submitted ||
      item.status === 'completed' ||
      Number(item.is_active) === 0 ||
      (item.end_date && new Date(item.end_date).getTime() < Date.now()) ||
      (item.days_remaining != null && Number(item.days_remaining) < 0)
    );

    res.json({ active, past, completed: past.filter(item => item.has_submitted || item.status === 'completed') });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch user challenges' });
  }
});

// ==================== CHALLENGES ROUTES ====================

app.get('/api/challenges', async (req, res) => {
  try {
    const viewer = optionalAuth(req);
    const [challenges] = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM submissions s WHERE s.challenge_id = c.id) AS submission_count,
        (SELECT MAX(s.created_at) FROM submissions s WHERE s.challenge_id = c.id) AS latest_submission_at,
        (
          (SELECT COUNT(DISTINCT uc.user_id) FROM user_challenges uc WHERE uc.challenge_id = c.id)
          +
          (SELECT COUNT(DISTINCT s.user_id)
           FROM submissions s
           LEFT JOIN user_challenges uc2
             ON uc2.challenge_id = s.challenge_id AND uc2.user_id = s.user_id
           WHERE s.challenge_id = c.id AND uc2.id IS NULL)
        ) AS participant_count,
        (SELECT COUNT(*)
         FROM comments cm
         JOIN submissions s2 ON s2.id = cm.submission_id
         WHERE s2.challenge_id = c.id) AS comment_count
      FROM challenges c
      ORDER BY c.created_at DESC
    `);
    if (viewer?.id && challenges.length > 0) {
      const ids = challenges.map(c => c.id);
      const [enrollments] = await pool.query(
        `SELECT uc.challenge_id, uc.status, uc.personal_end_date,
          DATEDIFF(uc.personal_end_date, CURDATE()) AS days_remaining,
          (SELECT COUNT(*)
           FROM submissions s
           WHERE s.challenge_id = uc.challenge_id
             AND s.user_id != uc.user_id
             AND s.created_at > uc.created_at) AS new_submission_count,
          EXISTS(SELECT 1 FROM submissions s WHERE s.user_id = ? AND s.challenge_id = uc.challenge_id) AS has_submission
         FROM user_challenges uc
         WHERE uc.user_id = ? AND uc.challenge_id IN (?)`,
        [viewer.id, viewer.id, ids]
      );
      const byChallenge = new Map(enrollments.map(e => [
        e.challenge_id,
        {
          ...e,
          status: e.has_submission ? 'completed' : 'active',
          days_remaining: e.days_remaining == null ? null : Number(e.days_remaining),
          new_submission_count: Number(e.new_submission_count || 0),
          has_submission: !!e.has_submission,
        },
      ]));
      const [completedRows] = await pool.query(
        'SELECT DISTINCT challenge_id FROM submissions WHERE user_id = ? AND challenge_id IN (?)',
        [viewer.id, ids]
      );
      completedRows.forEach(row => {
        byChallenge.set(row.challenge_id, {
          ...(byChallenge.get(row.challenge_id) || { challenge_id: row.challenge_id }),
          status: 'completed',
          has_submission: true,
        });
      });
      challenges.forEach(c => {
        const uc = byChallenge.get(c.id);
        if (uc) c.user_challenge = uc;
      });
    }
    res.json({ challenges });
  } catch {
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// End a challenge early (admin only)
app.post('/api/challenges/:id/end', adminAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE challenges SET is_active = FALSE, end_date = NOW() WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to end challenge' });
  }
});

app.get('/api/challenges/:id', async (req, res) => {
  try {
    const [challenges] = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM submissions s WHERE s.challenge_id = c.id) AS submission_count,
        (
          (SELECT COUNT(DISTINCT uc.user_id) FROM user_challenges uc WHERE uc.challenge_id = c.id)
          +
          (SELECT COUNT(DISTINCT s.user_id)
           FROM submissions s
           LEFT JOIN user_challenges uc2
             ON uc2.challenge_id = s.challenge_id AND uc2.user_id = s.user_id
           WHERE s.challenge_id = c.id AND uc2.id IS NULL)
        ) AS participant_count,
        (SELECT COUNT(*)
         FROM comments cm
         JOIN submissions s2 ON s2.id = cm.submission_id
         WHERE s2.challenge_id = c.id) AS comment_count
      FROM challenges c
      WHERE c.id = ?
    `, [req.params.id]);
    if (challenges.length === 0) return res.status(404).json({ error: 'Challenge not found' });
    const challenge = challenges[0];
    const viewer = optionalAuth(req);
    if (viewer?.id) {
      const [enrollments] = await pool.query(
        `SELECT uc.challenge_id, uc.status, uc.personal_end_date,
          DATEDIFF(uc.personal_end_date, CURDATE()) AS days_remaining,
          EXISTS(SELECT 1 FROM submissions s WHERE s.user_id = ? AND s.challenge_id = uc.challenge_id) AS has_submission
         FROM user_challenges uc
         WHERE uc.user_id = ? AND uc.challenge_id = ?`,
        [viewer.id, viewer.id, req.params.id]
      );
      if (enrollments[0]) {
        challenge.user_challenge = {
          ...enrollments[0],
          status: enrollments[0].has_submission ? 'completed' : 'active',
          days_remaining: enrollments[0].days_remaining == null ? null : Number(enrollments[0].days_remaining),
          has_submission: !!enrollments[0].has_submission,
        };
      }
      const [completedRows] = await pool.query(
        'SELECT id FROM submissions WHERE user_id = ? AND challenge_id = ? LIMIT 1',
        [viewer.id, req.params.id]
      );
      if (completedRows[0]) {
        challenge.user_challenge = {
          ...(challenge.user_challenge || { challenge_id: Number(req.params.id) }),
          status: 'completed',
          has_submission: true,
        };
      }
    }
    res.json({ challenge });
  } catch {
    res.status(500).json({ error: 'Failed to fetch challenge' });
  }
});

app.post('/api/challenges/:id/enter', auth, async (req, res) => {
  try {
    const [challenges] = await pool.query('SELECT id, duration_days, is_active, end_date FROM challenges WHERE id = ?', [req.params.id]);
    if (challenges.length === 0) return res.status(404).json({ error: 'Challenge not found' });
    if (!challenges[0].is_active) return res.status(400).json({ error: 'Challenge is not active' });
    if (challenges[0].end_date && new Date(challenges[0].end_date).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Challenge is archived' });
    }
    const durationDays = Number(challenges[0].duration_days || 30);
    await pool.query(
      `INSERT INTO user_challenges (user_id, challenge_id, status, personal_end_date)
       VALUES (?, ?, 'active', DATE_ADD(CURDATE(), INTERVAL ? DAY))
       ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      [req.user.id, req.params.id, durationDays]
    );
    const [[userChallenge]] = await pool.query(
      `SELECT challenge_id, status, personal_end_date, DATEDIFF(personal_end_date, CURDATE()) AS days_remaining
       FROM user_challenges WHERE user_id = ? AND challenge_id = ?`,
      [req.user.id, req.params.id]
    );
    res.json({ success: true, user_challenge: userChallenge });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to join challenge' });
  }
});

app.get('/api/challenges/:id/enrollment', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT uc.challenge_id, uc.status, uc.personal_end_date,
        DATEDIFF(uc.personal_end_date, CURDATE()) AS days_remaining,
        EXISTS(SELECT 1 FROM submissions s WHERE s.user_id = ? AND s.challenge_id = uc.challenge_id) AS has_submission
       FROM user_challenges uc
       WHERE uc.user_id = ? AND uc.challenge_id = ?`,
      [req.user.id, req.user.id, req.params.id]
    );
    if (!rows[0]) {
      const [completedRows] = await pool.query(
        'SELECT id FROM submissions WHERE user_id = ? AND challenge_id = ? LIMIT 1',
        [req.user.id, req.params.id]
      );
      if (completedRows[0]) {
        return res.json({ enrolled: true, user_challenge: { challenge_id: Number(req.params.id), status: 'completed', has_submission: true } });
      }
      return res.json({ enrolled: false, user_challenge: null });
    }
    const userChallenge = {
      ...rows[0],
      status: rows[0].has_submission ? 'completed' : 'active',
      days_remaining: rows[0].days_remaining == null ? null : Number(rows[0].days_remaining),
      has_submission: !!rows[0].has_submission,
    };
    res.json({ enrolled: true, user_challenge: userChallenge });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch enrollment' });
  }
});

// Helper: send password reset / welcome email to a single user
async function notifyPasswordReset({ email, name, token, type }) {
  try {
    const [[fromSetting]] = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'notification_from_email'").catch(() => [[]]);
    const fromEmail = fromSetting?.setting_value || 'noreply@photoai.betaplanets.com';
    const resetUrl = `https://photoai.betaplanets.com/reset-password?token=${token}`;
    const payload = JSON.stringify({ email, name, token, type, reset_url: resetUrl, from_email: fromEmail, from_name: 'Photo Healthy' });

    const http = require('http');
    const opts = {
      hostname: 'localhost', port: 80,
      path: '/notify-reset.php', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    };
    const phpReq = http.request(opts, phpRes => {
      let body = '';
      phpRes.on('data', d => body += d);
      phpRes.on('end', () => { console.log('[notify] Reset email result:', body.slice(0, 200)); });
    });
    phpReq.on('error', e => console.error('[notify] Reset email error:', e.message));
    phpReq.write(payload);
    phpReq.end();
  } catch (e) {
    console.error('[notify] notifyPasswordReset error:', e.message);
  }
}

// Helper: blast challenge announcement email to all users
// Helper: send subscription lifecycle email via notify-subscription.php
async function notifySubscription({ type, email, name, renews_at, ends_at, amount }) {
  try {
    const http = require('http');
    const payload = JSON.stringify({ type, email, name, renews_at: renews_at || null, ends_at: ends_at || null, amount: amount || '$9.99' });
    return new Promise((resolve) => {
      const req = http.request({ hostname: '127.0.0.1', port: 80, path: '/notify-subscription.php', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } }, (res) => {
        let body = ''; res.on('data', d => body += d); res.on('end', () => { console.log(`[notify-subscription] ${type} â†’ ${email}:`, body); resolve(); });
      });
      req.on('error', e => { console.error('[notify-subscription] error:', e.message); resolve(); });
      req.write(payload); req.end();
    });
  } catch (e) { console.error('[notify-subscription] error:', e.message); }
}

// Send order confirmation email to the customer
async function notifyOrderConfirmation(order) {
  if (!order.customer_email) return;
  let items = [];
  try { items = JSON.parse(order.items_json || '[]'); } catch {}

  const itemsHtml = items.map(i =>
    `<tr><td style="padding:6px 0">${i.name || 'Item'}</td><td style="padding:6px 0;text-align:right">x${i.quantity || 1}</td><td style="padding:6px 0;text-align:right">$${((i.price || 0) * (i.quantity || 1)).toFixed(2)}</td></tr>`
  ).join('');

  const body = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#202333;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
  <div style="background:linear-gradient(135deg,#F55B09,#FFD000);border-radius:14px;padding:32px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:26px">Order Confirmed! ðŸŽ‰</h1>
    <p style="color:rgba(255,255,255,0.9);margin:10px 0 0">Order #${order.id}</p>
  </div>
  <div style="background:#3B3E4F;border-radius:14px;padding:28px;margin-bottom:16px">
    <p style="color:#EAECEF;margin:0 0 16px">Hi ${order.customer_name || 'there'},</p>
    <p style="color:#C0C7D1;margin:0 0 20px">Thank you for your purchase! Here's a summary of your order:</p>
    <table style="width:100%;border-collapse:collapse;color:#EAECEF;font-size:14px">${itemsHtml}</table>
    <hr style="border:none;border-top:1px solid #4C5763;margin:16px 0">
    <div style="display:flex;justify-content:space-between">
      <strong style="color:#EAECEF">Total</strong>
      <strong style="color:#F55B09;font-size:18px">$${parseFloat(order.total_amount || 0).toFixed(2)}</strong>
    </div>
  </div>
  <div style="background:#3B3E4F;border-radius:14px;padding:20px;margin-bottom:24px">
    <p style="color:#C0C7D1;margin:0;font-size:13px">ðŸ“¦ Your order is being prepared. You'll receive another email with tracking info once it ships.</p>
    <p style="color:#C0C7D1;margin:10px 0 0;font-size:13px">Questions? Reply to this email or visit <a href="https://photoai.betaplanets.com/contact" style="color:#F55B09">our contact page</a>.</p>
  </div>
  <p style="color:#6F7D8B;font-size:12px;text-align:center">Photo Healthy Â· photoai.betaplanets.com</p>
</div></body></html>`;

  return new Promise((resolve) => {
    const http = require('http');
    const payload = JSON.stringify({
      order_id: order.id,
      email: order.customer_email,
      name: order.customer_name || '',
      total: order.total_amount,
      items: order.items_json || '[]',
      shipping_address: order.shipping_address_json || null,
      shipping_method: order.shipping_method || '',
    });
    const phpReq = http.request({
      hostname: '127.0.0.1', port: 80,
      path: '/notify-order-confirm.php', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (r) => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => { console.log('[notify-order-confirm]', r.statusCode, body); resolve(r.statusCode); });
    });
    phpReq.on('error', (e) => { console.error('[notify-order-confirm] error:', e.message); resolve(0); });
    phpReq.write(payload);
    phpReq.end();
  });
}

async function notifyChallengeCreated(challenge) {
  try {
    const [users] = await pool.query("SELECT name, email FROM users WHERE email IS NOT NULL AND email != '' AND is_suspended = FALSE");
    if (!users.length) return;

    // Get configured from-email from settings
    const [[fromSetting]] = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'notification_from_email'").catch(() => [[]]);
    const fromEmail = fromSetting?.setting_value || 'noreply@photoai.betaplanets.com';

    const payload = JSON.stringify({ challenge, recipients: users, from_email: fromEmail, from_name: 'Photo Healthy' });

    // Call PHP mailer via localhost (bypasses LiteSpeed bot-check)
    const http = require('http');
    const opts = {
      hostname: 'localhost', port: 80,
      path: '/notify-challenge.php', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    };
    const phpReq = http.request(opts, phpRes => {
      let body = '';
      phpRes.on('data', d => body += d);
      phpRes.on('end', () => {
        try { const r = JSON.parse(body); console.log(`[notify] Challenge blast: sent=${r.sent} failed=${r.failed}`); }
        catch { console.log('[notify] PHP response:', body.slice(0, 200)); }
      });
    });
    phpReq.on('error', e => console.error('[notify] PHP mailer error:', e.message));
    phpReq.write(payload);
    phpReq.end();
  } catch (e) {
    console.error('[notify] notifyChallengeCreated error:', e.message);
  }
}

app.post('/api/challenges', adminAuth, async (req, res) => {
  try {
    const { title, description, cover_image_url, start_date, end_date, start_time, end_time, is_active, category, feeling_category, movement_category, duration_days, partner_url, photo_inspiration, reflection_prompt, is_pro_only, tags } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const durationDays = parseInt(duration_days) || 30;
    const fallbackStartDate = new Date().toISOString().slice(0, 10);
    const fallbackEnd = new Date();
    fallbackEnd.setDate(fallbackEnd.getDate() + durationDays);
    const fallbackEndDate = fallbackEnd.toISOString().slice(0, 10);

    const [result] = await pool.query(
      'INSERT INTO challenges (title, description, cover_image_url, start_date, end_date, start_time, end_time, is_active, category, feeling_category, movement_category, duration_days, partner_url, photo_inspiration, reflection_prompt, is_pro_only, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || null, cover_image_url || null, start_date || fallbackStartDate, end_date || fallbackEndDate, start_time || null, end_time || null, is_active !== false, category || null, feeling_category || null, movement_category || null, durationDays, partner_url || null, photo_inspiration || null, reflection_prompt || null, is_pro_only ? 1 : 0, tags || null]
    );

    const newId = result.insertId;
    res.json({ id: newId, success: true });

    // Fire-and-forget: email all users about the new challenge
    notifyChallengeCreated({ id: newId, title, description, cover_image_url, start_date, end_date, category }).catch(() => {});
  } catch (e) {
    console.error('[Challenge create]', e.message);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

app.put('/api/challenges/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, cover_image_url, start_date, end_date, start_time, end_time, is_active, category, feeling_category, movement_category, duration_days, partner_url, photo_inspiration, reflection_prompt, is_pro_only, tags } = req.body;
    await pool.query(
      'UPDATE challenges SET title=?, description=?, cover_image_url=?, start_date=?, end_date=?, start_time=?, end_time=?, is_active=?, category=?, feeling_category=?, movement_category=?, duration_days=?, partner_url=?, photo_inspiration=?, reflection_prompt=?, is_pro_only=?, tags=? WHERE id=?',
      [title, description, cover_image_url, start_date || null, end_date || null, start_time || null, end_time || null, is_active, category || null, feeling_category || null, movement_category || null, parseInt(duration_days) || 30, partner_url || null, photo_inspiration || null, reflection_prompt || null, is_pro_only ? 1 : 0, tags || null, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[Challenge update]', e.message);
    res.status(500).json({ error: 'Failed to update challenge' });
  }
});

async function handleDeleteChallenge(req, res) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const challengeId = req.params.id;
    const [subs] = await conn.query('SELECT id FROM submissions WHERE challenge_id = ?', [challengeId]);
    const subIds = subs.map(s => s.id);
    if (subIds.length) {
      const [comments] = await conn.query('SELECT id FROM comments WHERE submission_id IN (?)', [subIds]);
      const commentIds = comments.map(c => c.id);
      if (commentIds.length) {
        await conn.query("DELETE FROM reports WHERE type = 'comment' AND target_id IN (?)", [commentIds]);
      }
      await conn.query("DELETE FROM reports WHERE type = 'submission' AND target_id IN (?)", [subIds]);
      await conn.query('DELETE FROM likes WHERE submission_id IN (?)', [subIds]);
      await conn.query('DELETE FROM comments WHERE submission_id IN (?)', [subIds]);
      await conn.query('DELETE FROM submissions WHERE id IN (?)', [subIds]);
    }
    await conn.query('DELETE FROM challenge_bans WHERE challenge_id = ?', [challengeId]);
    await conn.query('DELETE FROM user_challenges WHERE challenge_id = ?', [challengeId]);
    await conn.query('DELETE FROM challenges WHERE id = ?', [challengeId]);
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    await conn.rollback();
    console.error('[Challenge delete]', e.message);
    res.status(500).json({ error: e.message || 'Failed to delete challenge' });
  } finally {
    conn.release();
  }
}
app.delete('/api/challenges/:id', adminAuth, handleDeleteChallenge);
app.post('/api/challenges/:id/delete', adminAuth, handleDeleteChallenge);

app.get('/api/taxonomy', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('challenge_categories','feeling_categories','movement_categories')"
    );
    const taxonomy = { ...DEFAULT_TAXONOMY };
    rows.forEach(row => {
      try {
        const parsed = JSON.parse(row.setting_value || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) taxonomy[row.setting_key] = parsed;
      } catch {}
    });
    res.json(taxonomy);
  } catch (e) {
    res.json(DEFAULT_TAXONOMY);
  }
});

app.get('/api/admin/taxonomy', adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('challenge_categories','feeling_categories','movement_categories')"
    );
    const taxonomy = { ...DEFAULT_TAXONOMY };
    rows.forEach(row => {
      try {
        const parsed = JSON.parse(row.setting_value || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) taxonomy[row.setting_key] = parsed;
      } catch {}
    });
    res.json(taxonomy);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to fetch taxonomy' });
  }
});

app.put('/api/admin/taxonomy', adminAuth, async (req, res) => {
  try {
    const { key, items } = req.body;
    if (!['challenge_categories', 'feeling_categories', 'movement_categories'].includes(key)) {
      return res.status(400).json({ error: 'Invalid taxonomy key' });
    }
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });
    const clean = items.map(item => String(item).trim()).filter(Boolean);
    await pool.query(
      'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()',
      [key, JSON.stringify(clean), JSON.stringify(clean)]
    );
    res.json({ ok: true, key, items: clean });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to update taxonomy' });
  }
});

// ==================== SUBMISSIONS ROUTES ====================

app.get('/api/submissions', async (req, res) => {
  try {
    let query = `
      SELECT s.*,
        u.name as user_name,
        u.avatar_url as user_avatar_url,
        u.subscription_status as user_subscription_status,
        c.title as challenge_title,
        c.category as challenge_category,
        c.feeling_category as challenge_feeling_category,
        c.movement_category as challenge_movement_category,
        COALESCE((SELECT COUNT(*) FROM likes WHERE submission_id = s.id), 0) as like_count,
        COALESCE((SELECT COUNT(*) FROM comments WHERE submission_id = s.id), 0) as comment_count
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      JOIN challenges c ON s.challenge_id = c.id
    `;
    const params = [];
    const conditions = [];
    const challengeFilter = req.query.challenge_id || req.query.challengeId;
    if (challengeFilter) {
      conditions.push('s.challenge_id = ?');
      params.push(challengeFilter);
    }
    const userFilter = req.query.user_id || req.query.userId;
    if (userFilter) {
      conditions.push('s.user_id = ?');
      params.push(userFilter);
    }
    const categoryFilter = req.query.category;
    if (categoryFilter) {
      conditions.push('LOWER(TRIM(c.category)) = LOWER(TRIM(?))');
      params.push(String(categoryFilter));
    }
    const feelingFilter = req.query.feeling;
    if (feelingFilter) {
      conditions.push('LOWER(TRIM(c.feeling_category)) = LOWER(TRIM(?))');
      params.push(String(feelingFilter));
    }
    const movementFilter = req.query.movement;
    if (movementFilter) {
      conditions.push('LOWER(TRIM(c.movement_category)) = LOWER(TRIM(?))');
      params.push(String(movementFilter));
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY s.created_at DESC';
    const [submissions] = await pool.query(query, params);
    res.json({ submissions });
  } catch (e) {
    console.error('[submissions]', e.message);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

app.get('/api/submissions/:id', async (req, res) => {
  try {
    const viewer = optionalAuth(req);
    const [submissions] = await pool.query(
      `SELECT s.*, u.name as user_name, u.avatar_url as user_avatar_url, u.subscription_status as user_subscription_status,
              c.title as challenge_title, c.category as challenge_category,
              c.feeling_category as challenge_feeling_category, c.movement_category as challenge_movement_category,
              COALESCE((SELECT COUNT(*) FROM likes WHERE submission_id = s.id), 0) as like_count,
              COALESCE((SELECT COUNT(*) FROM comments WHERE submission_id = s.id), 0) as comment_count,
              CASE
                WHEN ? IS NULL THEN 0
                ELSE EXISTS(SELECT 1 FROM likes WHERE submission_id = s.id AND user_id = ?)
              END as liked_by_me
       FROM submissions s JOIN users u ON s.user_id = u.id JOIN challenges c ON s.challenge_id = c.id
       WHERE s.id = ?`,
      [viewer?.id || null, viewer?.id || null, req.params.id]
    );
    if (submissions.length === 0) return res.status(404).json({ error: 'Submission not found' });
    res.json({ submission: submissions[0] });
  } catch {
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

app.post('/api/submissions', auth, async (req, res) => {
  try {
    const { challenge_id, title, description } = req.body;
    const collectPhotoUrls = () => {
      const urls = [
        req.body.photo1_url || req.body.image_url || req.body.photo_url,
        req.body.photo2_url,
        req.body.photo3_url,
        req.body.photo4_url,
      ];
      const arrayInput = req.body.photo_urls || req.body.photos;
      if (Array.isArray(arrayInput)) {
        arrayInput.forEach(item => {
          const url = typeof item === 'string'
            ? item
            : item?.url || item?.photo_url || item?.image_url || item?.path;
          urls.push(url);
        });
      }
      return [...new Set(urls.filter(url => typeof url === 'string' && url.trim()).map(url => url.trim()))].slice(0, 4);
    };
    const photoUrls = collectPhotoUrls();
    if (!challenge_id || !title || !photoUrls[0]) return res.status(400).json({ error: 'Challenge, title, and photo required' });

    // Check user not suspended + get subscription status
    const [userRows] = await pool.query('SELECT is_suspended, subscription_status FROM users WHERE id = ?', [req.user.id]);
    if (userRows[0]?.is_suspended) return res.status(403).json({ error: 'Your account has been suspended' });
    const isPro = userRows[0]?.subscription_status === 'active';

    // Check challenge exists and is active
    const [challenges] = await pool.query('SELECT * FROM challenges WHERE id = ? AND is_active = TRUE', [challenge_id]);
    if (challenges.length === 0) return res.status(400).json({ error: 'Challenge not found or inactive' });
    if (challenges[0].end_date && new Date(challenges[0].end_date).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Challenge is archived' });
    }

    const [[commitment]] = await pool.query(
      `SELECT personal_end_date, DATEDIFF(personal_end_date, CURDATE()) AS days_remaining
       FROM user_challenges WHERE user_id = ? AND challenge_id = ?`,
      [req.user.id, challenge_id]
    );
    if (commitment && Number(commitment.days_remaining) < 0) {
      return res.status(403).json({ error: 'Your 30 day challenge window has expired' });
    }

    // Pro-only challenge gate
    if (challenges[0].is_pro_only && !isPro) {
      return res.status(403).json({ error: 'pro_required', message: 'This challenge is exclusive to Pro members.' });
    }

    // Free tier monthly submission limit (50 per month)
    if (!isPro) {
      const [[{ monthCount }]] = await pool.query(
        `SELECT COUNT(*) as monthCount FROM submissions
         WHERE user_id = ? AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
        [req.user.id]
      );
      if (monthCount >= 50) {
        return res.status(403).json({ error: 'limit_reached', message: 'Free accounts can submit to 50 challenges per month. Upgrade to Pro for unlimited submissions.' });
      }
    }

    // Check user not banned from this challenge
    const [bans] = await pool.query('SELECT id FROM challenge_bans WHERE user_id = ? AND challenge_id = ?', [req.user.id, challenge_id]);
    if (bans.length > 0) return res.status(403).json({ error: 'You have been banned from this challenge' });

    // Check if user already submitted
    const [existing] = await pool.query('SELECT id FROM submissions WHERE user_id = ? AND challenge_id = ?', [req.user.id, challenge_id]);
    if (existing.length > 0) return res.status(400).json({ error: 'You already submitted to this challenge' });

    const miles = req.body.miles_walked != null
      ? parseFloat(req.body.miles_walked)
      : req.body.miles != null
        ? parseFloat(req.body.miles)
        : null;

    const [result] = await pool.query(
      'INSERT INTO submissions (user_id, challenge_id, title, description, photo1_url, photo2_url, photo3_url, photo4_url, miles_walked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, challenge_id, title, description || null, photoUrls[0], photoUrls[1] || null, photoUrls[2] || null, photoUrls[3] || null, miles]
    );

    // Update user's cumulative mileage if provided
    if (miles != null && miles > 0) {
      await pool.query('UPDATE users SET total_miles = COALESCE(total_miles, 0) + ? WHERE id = ?', [miles, req.user.id]);
    }

    await pool.query(
      `INSERT INTO user_challenges (user_id, challenge_id, status, personal_end_date)
       VALUES (?, ?, 'completed', DATE_ADD(CURDATE(), INTERVAL ? DAY))
       ON DUPLICATE KEY UPDATE status = 'completed'`,
      [req.user.id, challenge_id, Number(challenges[0].duration_days || 30)]
    );

    res.json({ id: result.insertId, success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'You already submitted to this challenge' });
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

app.patch('/api/submissions/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['title', 'description', 'photo1_url', 'photo2_url', 'photo3_url', 'photo4_url', 'miles_walked'];
    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        let value = req.body[key];
        if (key === 'title') {
          value = String(value || '').trim();
          if (!value) return res.status(400).json({ error: 'Submission title is required' });
        }
        if (key.startsWith('photo')) {
          value = String(value || '').trim() || null;
        }
        if (key === 'miles_walked') {
          value = value === '' || value == null ? null : parseFloat(value);
          if (value != null && Number.isNaN(value)) return res.status(400).json({ error: 'Miles must be a number' });
        }
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'No submission changes provided' });
    values.push(req.params.id);
    const [result] = await pool.query(`UPDATE submissions SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Submission not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to update submission' });
  }
});

async function handleDeleteSubmission(req, res) {
  try {
    await pool.query('DELETE FROM submissions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete submission' }); }
}
app.delete('/api/submissions/:id', adminAuth, handleDeleteSubmission);
app.post('/api/submissions/:id/delete', adminAuth, handleDeleteSubmission);

app.post('/api/submissions/:id/like', auth, async (req, res) => {
  try {
    const submissionId = Number(req.params.id);
    if (!submissionId) return res.status(400).json({ error: 'Submission ID required' });

    const [[submission]] = await pool.query('SELECT id FROM submissions WHERE id = ?', [submissionId]);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE user_id = ? AND submission_id = ? LIMIT 1',
      [req.user.id, submissionId]
    );

    let liked = false;
    if (existing.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id = ? AND submission_id = ?', [req.user.id, submissionId]);
    } else {
      await pool.query(
        'INSERT INTO likes (user_id, submission_id) VALUES (?, ?)',
        [req.user.id, submissionId]
      );
      liked = true;
    }

    const [[countRow]] = await pool.query(
      'SELECT COUNT(*) AS like_count FROM likes WHERE submission_id = ?',
      [submissionId]
    );
    res.json({ liked, like_count: Number(countRow?.like_count || 0) });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      const [[countRow]] = await pool.query(
        'SELECT COUNT(*) AS like_count FROM likes WHERE submission_id = ?',
        [req.params.id]
      );
      return res.json({ liked: true, like_count: Number(countRow?.like_count || 0) });
    }
    console.error('[like submission]', e.message);
    res.status(500).json({ error: e.message || 'Failed to like submission' });
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

async function handleDeleteComment(req, res) {
  try {
    const [comments] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [req.params.id]);
    if (comments.length === 0) return res.status(404).json({ error: 'Comment not found' });
    if (comments[0].user_id !== req.user.id && !req.user.is_admin && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}
app.delete('/api/comments/:id', auth, handleDeleteComment);
app.post('/api/comments/:id/delete', auth, handleDeleteComment);

app.patch('/api/comments/:id', auth, async (req, res) => {
  try {
    const [comments] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [req.params.id]);
    if (comments.length === 0) return res.status(404).json({ error: 'Comment not found' });
    if (comments[0].user_id !== req.user.id && !req.user.is_admin && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'text required' });
    await pool.query('UPDATE comments SET text = ? WHERE id = ?', [text.trim(), req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// ==================== USERS ROUTES (ADMIN) ====================

app.get('/api/users', adminAuth, async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.is_admin,
        u.subscription_status, u.subscription_type, u.subscription_note,
        u.stripe_customer_id, u.stripe_subscription_id, u.subscription_ends_at,
        u.is_suspended, u.suspended_reason, u.is_deleted, u.deleted_at, u.bio, u.location, u.created_at,
        (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id) as submission_count,
        (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) as comment_count
       FROM users u ORDER BY u.created_at DESC`
    );
    res.json({ users: users.map(u => ({ ...u, is_admin: !!u.is_admin, is_deleted: !!u.is_deleted })) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id/activity â€” submissions + comments for one user
app.get('/api/admin/users/:id/activity', adminAuth, async (req, res) => {
  try {
    const uid = req.params.id;
    const [submissions] = await pool.query(
      `SELECT s.id, s.title, s.description, s.photo1_url, s.photo2_url, s.created_at,
              c.title as challenge_title, c.id as challenge_id
       FROM submissions s LEFT JOIN challenges c ON s.challenge_id = c.id
       WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT 100`, [uid]
    );
    const [comments] = await pool.query(
      `SELECT cm.id, cm.text, cm.created_at, s.title as submission_title, s.id as submission_id,
              s.photo1_url as submission_photo
       FROM comments cm LEFT JOIN submissions s ON cm.submission_id = s.id
       WHERE cm.user_id = ? ORDER BY cm.created_at DESC LIMIT 200`, [uid]
    );
    res.json({ submissions, comments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/users â€” create a new user and email them a reset link
app.post('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const { name, email, is_admin } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
    const [existing] = await pool.query('SELECT id, is_deleted FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const bcrypt = require('bcryptjs');
    const tempPass = Math.random().toString(36).slice(-10) + 'A1!';
    const hash = await bcrypt.hash(tempPass, 10);
    const token = require('crypto').randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 72 * 3600 * 1000); // 72h

    await pool.query(
      'INSERT INTO users (name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)',
      [name, email, hash, is_admin ? 1 : 0]
    );
    const [[newUser]] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    await safeAddColumn('users', 'reset_token', 'VARCHAR(64) NULL');
    await safeAddColumn('users', 'reset_token_expires', 'TIMESTAMP NULL');
    await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [token, expires, newUser.id]);

    // Send welcome + set-password email via PHP
    const payload = JSON.stringify({ email, name, token, type: 'new_user' });
    const http = require('http');
    const postReq = http.request({ host: '127.0.0.1', port: 3001, path: '/internal/send-reset', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'x-internal': 'yes' }
    }, () => {});
    postReq.on('error', () => {});
    postReq.write(payload); postReq.end();

    notifyPasswordReset({ email, name, token, type: 'new_user' }).catch(() => {});
    res.json({ success: true, id: newUser.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/users/:id/reset-password â€” send reset link
app.post('/api/admin/users/:id/reset-password', adminAuth, async (req, res) => {
  try {
    await safeAddColumn('users', 'reset_token', 'VARCHAR(64) NULL');
    await safeAddColumn('users', 'reset_token_expires', 'TIMESTAMP NULL');
    const [[user]] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = require('crypto').randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 72 * 3600 * 1000);
    await pool.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [token, expires, user.id]);
    notifyPasswordReset({ email: user.email, name: user.name, token, type: 'reset' }).catch(() => {});
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/reset-password?token=xxx â€” validate + show form (returns user info)
app.get('/api/auth/reset-password', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });
    const [[user]] = await pool.query(
      'SELECT id, name, email FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [token]
    );
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
    res.json({ valid: true, email: user.email, name: user.name });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/auth/reset-password â€” apply new password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'token and password required' });
    const [[user]] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [token]
    );
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hash, user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', adminAuth, async (req, res) => {
  try {
    const { is_admin, subscription_status, name, avatar_url } = req.body;
    const updates = [];
    const params = [];
    if (is_admin !== undefined) { updates.push('is_admin = ?'); params.push(is_admin ? 1 : 0); }
    if (subscription_status) { updates.push('subscription_status = ?'); params.push(subscription_status); }
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (avatar_url !== undefined) { updates.push('avatar_url = ?'); params.push(avatar_url); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.params.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

async function handleDeleteUser(req, res) {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await pool.query('UPDATE users SET is_deleted = 1, deleted_at = NOW(), is_suspended = 1, suspended_reason = ? WHERE id = ?', ['Deleted by admin', req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
}
app.delete('/api/users/:id', adminAuth, handleDeleteUser);
// POST alias â€” LiteSpeed blocks DELETE through proxy
app.post('/api/users/:id/delete', adminAuth, handleDeleteUser);

app.post('/api/users/:id/restore', adminAuth, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_deleted = 0, deleted_at = NULL, is_suspended = 0, suspended_reason = NULL WHERE id = ?', [req.params.id]);
    const [[user]] = await pool.query(
      `SELECT id, name, email, avatar_url, is_admin, subscription_status, subscription_type, subscription_note,
        stripe_customer_id, stripe_subscription_id, subscription_ends_at, is_suspended, suspended_reason,
        is_deleted, deleted_at, bio, location, created_at,
        (SELECT COUNT(*) FROM submissions s WHERE s.user_id = users.id) as submission_count,
        (SELECT COUNT(*) FROM comments c WHERE c.user_id = users.id) as comment_count
       FROM users WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true, user: user ? { ...user, is_admin: !!user.is_admin, is_deleted: !!user.is_deleted } : null });
  } catch {
    res.status(500).json({ error: 'Failed to restore user' });
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

const PRO_PLAN = {
  name: 'Photo Healthy Pro',
  description: 'Unlimited challenge entries, exclusive challenges, ad-free experience',
  amount: 999, // $9.99 in cents
  interval: 'month',
};

// GET /api/subscription/status
app.get('/api/subscription/status', auth, async (req, res) => {
  try {
    const [[u]] = await pool.query(
      'SELECT subscription_status, stripe_subscription_id, subscription_ends_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({
      status: u?.subscription_status || 'free',
      subscriptionId: u?.stripe_subscription_id || null,
      endsAt: u?.subscription_ends_at || null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/subscribe â€” create Stripe Checkout session (subscription mode)
app.post('/api/subscribe', auth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const [[u]] = await pool.query('SELECT id, name, email, stripe_customer_id FROM users WHERE id = ?', [req.user.id]);
    const origin = process.env.APP_URL || 'https://photoai.betaplanets.com';

    // Create or reuse Stripe customer
    let customerId = u.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: u.email, name: u.name, metadata: { user_id: String(u.id) } });
      customerId = customer.id;
      await pool.query('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [customerId, u.id]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: PRO_PLAN.amount,
          recurring: { interval: PRO_PLAN.interval },
          product_data: { name: PRO_PLAN.name, description: PRO_PLAN.description },
        },
        quantity: 1,
      }],
      // PHP trampoline to bypass LiteSpeed WAF
      success_url: `${origin}/stripe-return.php?type=sub&status=success`,
      cancel_url: `${origin}/stripe-return.php?type=sub&status=cancelled`,
      metadata: { user_id: String(u.id), type: 'subscription' },
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error('[subscribe]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/subscription/cancel â€” cancel at period end
app.post('/api/subscription/cancel', auth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const [[u]] = await pool.query('SELECT stripe_subscription_id FROM users WHERE id = ?', [req.user.id]);
    if (!u?.stripe_subscription_id) return res.status(400).json({ error: 'No active subscription' });

    const sub = await stripe.subscriptions.update(u.stripe_subscription_id, { cancel_at_period_end: true });
    const endsAt = new Date(sub.current_period_end * 1000);
    await pool.query('UPDATE users SET subscription_ends_at = ? WHERE id = ?', [endsAt, req.user.id]);
    // Send cancellation confirmation email
    const [[user]] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]).catch(() => [[]]);
    if (user) notifySubscription({ type: 'cancelled', email: user.email, name: user.name, ends_at: endsAt.toISOString() }).catch(() => {});
    res.json({ success: true, endsAt: endsAt.toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/subscription/portal â€” Stripe billing portal
app.post('/api/subscription/portal', auth, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const [[u]] = await pool.query('SELECT stripe_customer_id FROM users WHERE id = ?', [req.user.id]);
    if (!u?.stripe_customer_id) return res.status(400).json({ error: 'No billing info found' });
    const origin = process.env.APP_URL || 'https://photoai.betaplanets.com';
    const portal = await stripe.billingPortal.sessions.create({
      customer: u.stripe_customer_id,
      return_url: `${origin}/subscription`,
    });
    res.json({ url: portal.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// â”€â”€ Admin: Grant free Pro membership â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post('/api/admin/users/:id/grant-pro', adminAuth, async (req, res) => {
  try {
    const { days = 30, note = '' } = req.body;
    if (!days || days < 1 || days > 3650) return res.status(400).json({ error: 'days must be 1â€“3650' });
    const [[u]] = await pool.query('SELECT name, email, subscription_status, subscription_ends_at FROM users WHERE id = ?', [req.params.id]);
    if (!u) return res.status(404).json({ error: 'User not found' });

    // Calculate new end date: extend from current end if still active, otherwise from today
    const base = (u.subscription_status === 'active' && u.subscription_ends_at && new Date(u.subscription_ends_at) > new Date())
      ? new Date(u.subscription_ends_at)
      : new Date();
    const endsAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users SET subscription_status = 'active', subscription_type = 'manual',
       subscription_ends_at = ?, subscription_note = ?,
       subscription_started_at = COALESCE(subscription_started_at, NOW()) WHERE id = ?`,
      [endsAt, note || `Admin grant: ${days} days`, req.params.id]
    );

    // Send email + log event
    notifySubscription({ type: 'activated', email: u.email, name: u.name, renews_at: endsAt.toISOString(), amount: 'Free' }).catch(() => {});
    logSubEvent(req.params.id, 'admin_grant', `Admin granted ${days}-day Pro access${note ? ': ' + note : ''}`, 0);

    res.json({ success: true, endsAt: endsAt.toISOString(), days });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// â”€â”€ Admin: Extend Pro membership â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post('/api/admin/users/:id/extend-pro', adminAuth, async (req, res) => {
  try {
    const { days = 30 } = req.body;
    if (!days || days < 1 || days > 3650) return res.status(400).json({ error: 'days must be 1â€“3650' });
    const [[u]] = await pool.query('SELECT name, email, subscription_status, subscription_ends_at FROM users WHERE id = ?', [req.params.id]);
    if (!u) return res.status(404).json({ error: 'User not found' });

    const base = (u.subscription_ends_at && new Date(u.subscription_ends_at) > new Date())
      ? new Date(u.subscription_ends_at)
      : new Date();
    const endsAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users SET subscription_status = 'active', subscription_ends_at = ? WHERE id = ?`,
      [endsAt, req.params.id]
    );

    // Email + log
    notifySubscription({ type: 'renewed', email: u.email, name: u.name, renews_at: endsAt.toISOString(), amount: 'Extended' }).catch(() => {});
    logSubEvent(req.params.id, 'admin_extend', `Admin extended Pro by ${days} days (expires ${endsAt.toLocaleDateString()})`, 0);

    res.json({ success: true, endsAt: endsAt.toISOString(), days });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// â”€â”€ Admin: Revoke Pro membership immediately â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post('/api/admin/users/:id/revoke-pro', adminAuth, async (req, res) => {
  try {
    const [[u]] = await pool.query('SELECT name, email, stripe_subscription_id FROM users WHERE id = ?', [req.params.id]);
    if (!u) return res.status(404).json({ error: 'User not found' });

    // Cancel Stripe sub immediately if it exists
    if (stripe && u.stripe_subscription_id) {
      await stripe.subscriptions.cancel(u.stripe_subscription_id).catch(e => console.error('[revoke] stripe cancel:', e.message));
    }

    await pool.query(
      `UPDATE users SET subscription_status = 'free', stripe_subscription_id = NULL,
       subscription_ends_at = NULL, subscription_type = NULL, subscription_note = NULL WHERE id = ?`,
      [req.params.id]
    );

    notifySubscription({ type: 'ended', email: u.email, name: u.name }).catch(() => {});
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// NOTE: SPA fallback moved to AFTER all API routes â€” see bottom of file

// Global error handler â€” always return JSON, never HTML
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Catch-all for unhandled promise rejections â€” log only, don't crash
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('exit', (code) => {
  console.error(`[EXIT] Process exiting with code ${code}`, new Error().stack);
});

// CloudLinux shared hosting sends SIGTERM to background processes â€” ignore it
// so the server stays alive. SIGKILL (unblockable) will still kill it if needed.
process.on('SIGTERM', () => {
  console.error('[SIGTERM] Received SIGTERM â€” ignoring, server staying alive');
});

process.on('SIGINT', () => {
  console.error('[SIGINT] Received SIGINT');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.message, err.stack);
  // Don't exit â€” log and continue
});

// ==================== MODERATION ROUTES ====================

// â”€â”€ Reports: submit â”€â”€
app.post('/api/reports', auth, async (req, res) => {
  try {
    const { type, target_id, reason } = req.body;
    if (!type || !target_id) return res.status(400).json({ error: 'type and target_id required' });
    await pool.query(
      'INSERT INTO reports (reporter_id, type, target_id, reason) VALUES (?, ?, ?, ?)',
      [req.user.id, type, target_id, reason || null]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to submit report' }); }
});

// â”€â”€ Reports: list (admin) â”€â”€
app.get('/api/admin/reports', adminAuth, async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const [reports] = await pool.query(`
      SELECT r.*, u.name AS reporter_name,
        CASE
          WHEN r.type = 'submission' THEN (SELECT title FROM submissions WHERE id = r.target_id)
          WHEN r.type = 'comment' THEN (SELECT text FROM comments WHERE id = r.target_id)
          ELSE NULL
        END AS target_preview,
        CASE
          WHEN r.type = 'submission' THEN (SELECT photo1_url FROM submissions WHERE id = r.target_id)
          ELSE NULL
        END AS target_photo
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      WHERE r.status = ?
      ORDER BY r.created_at DESC
    `, [status]);
    res.json({ reports });
  } catch { res.status(500).json({ error: 'Failed to fetch reports' }); }
});

// â”€â”€ Reports: update status (admin) â”€â”€
app.patch('/api/admin/reports/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to update report' }); }
});

// â”€â”€ Users: suspend/unsuspend (admin) â”€â”€
app.post('/api/admin/users/:id/suspend', adminAuth, async (req, res) => {
  try {
    const { suspended, reason } = req.body;
    await pool.query(
      'UPDATE users SET is_suspended = ?, suspended_reason = ? WHERE id = ?',
      [suspended ? 1 : 0, reason || null, req.params.id]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to update user' }); }
});

// â”€â”€ Challenge bans: ban user (admin) â”€â”€
app.post('/api/admin/challenges/:challengeId/ban', adminAuth, async (req, res) => {
  try {
    const { user_id, reason } = req.body;
    await pool.query(
      'INSERT INTO challenge_bans (user_id, challenge_id, banned_by, reason) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE reason = ?, banned_by = ?',
      [user_id, req.params.challengeId, req.user.id, reason || null, reason || null, req.user.id]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to ban user' }); }
});

// â”€â”€ Challenge bans: unban user (admin) â”€â”€
app.delete('/api/admin/challenges/:challengeId/ban/:userId', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM challenge_bans WHERE user_id = ? AND challenge_id = ?', [req.params.userId, req.params.challengeId]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to unban user' }); }
});

// â”€â”€ Challenge bans: list bans for a challenge (admin) â”€â”€
app.get('/api/admin/challenges/:challengeId/bans', adminAuth, async (req, res) => {
  try {
    const [bans] = await pool.query(`
      SELECT cb.*, u.name AS user_name, u.email AS user_email, admin.name AS banned_by_name
      FROM challenge_bans cb
      JOIN users u ON cb.user_id = u.id
      JOIN users admin ON cb.banned_by = admin.id
      WHERE cb.challenge_id = ?
      ORDER BY cb.created_at DESC
    `, [req.params.challengeId]);
    res.json({ bans });
  } catch { res.status(500).json({ error: 'Failed to fetch bans' }); }
});

// â”€â”€ Guard submissions: check suspension + challenge ban â”€â”€
// (injected into the existing submission creation â€” see POST /api/submissions)

// Heartbeat: keeps event loop alive and logs health every 30s
const _keepAlive = setInterval(() => {
  // no-op â€” just prevents event loop from draining
}, 30000);

// â”€â”€ Auto-expire challenges when end_date passes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function autoExpireChallenges() {
  try {
    const [result] = await pool.query(
      "UPDATE challenges SET is_active = FALSE WHERE end_date < CURDATE() AND is_active = TRUE"
    );
    if (result.affectedRows > 0) {
      console.log(`[Auto-expire] Closed ${result.affectedRows} challenge(s) past end date`);
    }
  } catch (e) {
    console.error('[Auto-expire] Error:', e.message);
  }
  // Also expire manual (non-Stripe) Pro memberships that have passed their end date
  try {
    const [expiredUsers] = await pool.query(
      `SELECT id, name, email FROM users
       WHERE subscription_status = 'active'
         AND subscription_type = 'manual'
         AND subscription_ends_at IS NOT NULL
         AND subscription_ends_at < NOW()`
    );
    if (expiredUsers.length > 0) {
      await pool.query(
        `UPDATE users SET subscription_status = 'free', subscription_note = NULL
         WHERE subscription_status = 'active' AND subscription_type = 'manual'
           AND subscription_ends_at IS NOT NULL AND subscription_ends_at < NOW()`
      );
      console.log(`[Auto-expire] Reverted ${expiredUsers.length} expired manual Pro membership(s)`);
      for (const u of expiredUsers) {
        notifySubscription({ type: 'ended', email: u.email, name: u.name }).catch(() => {});
      }
    }
  } catch (e) {
    console.error('[Auto-expire] Manual sub expiry error:', e.message);
  }
}
// Run immediately on startup, then every hour
autoExpireChallenges();
setInterval(autoExpireChallenges, 60 * 60 * 1000);
// â”€â”€ Stripe Setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? require('stripe')(stripeKey) : null;

// Raw body parser for Stripe webhooks (must come before express.json globally)
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

function extractStripeShipping(session) {
  const address = session.shipping_details?.address || session.customer_details?.address || null;
  return {
    address,
    name: session.shipping_details?.name || session.customer_details?.name || session.customer_email || null,
    email: session.customer_email || session.customer_details?.email || null,
    paymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
    shippingMethod: session.shipping_cost?.shipping_rate || session.shipping_details?.name || null,
  };
}

async function backfillOrderShippingFromStripe(order) {
  if (!stripe || !order?.stripe_session_id || String(order.stripe_session_id).startsWith('free_')) return order;
  if (order.shipping_address_json && order.customer_name && order.stripe_payment_intent) return order;
  try {
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {
      expand: ['payment_intent'],
    });
    const shipping = extractStripeShipping(session);
    if (!shipping.address && !shipping.name && !shipping.email && !shipping.paymentIntent) return order;
    const next = {
      ...order,
      customer_email: order.customer_email || shipping.email,
      customer_name: order.customer_name || shipping.name,
      stripe_payment_intent: order.stripe_payment_intent || shipping.paymentIntent,
      shipping_address_json: order.shipping_address_json || (shipping.address ? JSON.stringify({ name: shipping.name, ...shipping.address }) : null),
      shipping_method: order.shipping_method || shipping.shippingMethod,
    };
    await pool.query(
      `UPDATE orders SET
        customer_email = COALESCE(customer_email, ?),
        customer_name = COALESCE(customer_name, ?),
        stripe_payment_intent = COALESCE(stripe_payment_intent, ?),
        shipping_address_json = COALESCE(shipping_address_json, ?),
        shipping_method = COALESCE(shipping_method, ?)
       WHERE id = ?`,
      [shipping.email, shipping.name, shipping.paymentIntent, next.shipping_address_json, shipping.shippingMethod, order.id]
    );
    return next;
  } catch (e) {
    console.error('[orders] Stripe shipping backfill:', e.message);
    return order;
  }
}

// GET /api/orders/my â€” authenticated user's own order history
app.get('/api/orders/my', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const email = req.user.email;
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE (user_id = ? OR customer_email = ?) ORDER BY created_at DESC`,
      [uid, email]
    );
    // Also update any matching-email orders to have user_id
    if (email) {
      pool.query(`UPDATE orders SET user_id = ? WHERE customer_email = ? AND user_id IS NULL`, [uid, email]).catch(() => {});
    }
    res.json({ orders });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/notifications/my - dashboard notifications for the signed-in user
app.get('/api/notifications/my', auth, async (req, res) => {
  try {
    const [notifications] = await pool.query(
      `SELECT id, type, title, message, related_id, is_read, created_at
       FROM user_notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id]
    );
    res.json({ notifications, unread: notifications.filter(n => !n.is_read).length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/checkout/create-session â€” create a Stripe Checkout session
app.post('/api/checkout/create-session', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to .env' });

  const { items, success_url, cancel_url, coupon_code, gift_code } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'No items provided' });

  try {
    // Load product details for all items
    const ids = items.map(i => i.id);
    const [products] = await pool.query(
      `SELECT id, title, price, image_url, emoji, is_pro_only FROM products WHERE id IN (?) AND is_active = TRUE`,
      [ids]
    );
    if (!products.length) return res.status(400).json({ error: 'No valid products found' });

    const productMap = {};
    products.forEach(p => { productMap[p.id] = p; });

    // Pro-only product gate â€” check user subscription if any items are pro-only
    const hasProOnlyItem = products.some(p => p.is_pro_only);
    if (hasProOnlyItem) {
      let isPro = false;
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET || 'photohealthy_jwt_secret_2026');
          if (decoded?.userId) {
            const [[u]] = await pool.query('SELECT subscription_status FROM users WHERE id = ?', [decoded.userId]);
            isPro = u?.subscription_status === 'active';
          }
        } catch {}
      }
      const blockedItems = products.filter(p => p.is_pro_only && !isPro).map(p => p.title);
      if (blockedItems.length > 0) {
        return res.status(403).json({ error: 'pro_required', message: `These items require a Pro subscription: ${blockedItems.join(', ')}` });
      }
    }

    const line_items = items
      .filter(i => productMap[i.id])
      .map(i => {
        const p = productMap[i.id];
        const imgArr = p.image_url ? [p.image_url] : [];
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: p.title,
              ...(imgArr.length ? { images: imgArr } : {}),
            },
            unit_amount: Math.round(Number(p.price) * 100), // cents
          },
          quantity: i.quantity || 1,
        };
      });

    if (!line_items.length) return res.status(400).json({ error: 'No valid line items' });

    const subtotalCents = line_items.reduce((sum, li) => sum + (li.price_data.unit_amount * li.quantity), 0);
    const { codes: appliedDiscountCodes, discountCents } = await resolveDiscountCodes({
      couponCode: coupon_code,
      giftCode: gift_code,
      subtotalCents,
    });
    const payableCents = Math.max(0, subtotalCents - discountCents);
    const total = payableCents / 100;
    const discounted_line_items = applyDiscountToLineItems(line_items, discountCents);
    const enrichedItems = items
      .filter(i => productMap[i.id])
      .map(i => {
        const p = productMap[i.id];
        return { id: p.id, title: p.title, price: parseFloat(p.price), quantity: i.quantity || 1, size: i.size || null, emoji: p.emoji || null };
      });
    const discountSummary = appliedDiscountCodes.map(code => ({
      id: code.id,
      code: code.code,
      kind: code.kind,
      discount_type: code.discount_type,
      value: Number(code.value),
      discount: code.discount_cents / 100,
    }));

    const origin = req.headers.origin || 'https://photoai.betaplanets.com';
    // Detect authenticated user (optional)
    let userId = null, userEmail = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const tok = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(tok, process.env.JWT_SECRET || 'photohealthy_jwt_secret_2026');
        const [[u]] = await pool.query('SELECT id, email FROM users WHERE id = ?', [decoded.userId || decoded.id]);
        if (u) { userId = u.id; userEmail = u.email; }
      } catch {}
    }

    if (total <= 0) {
      await pool.query(
        `INSERT INTO orders (user_id, stripe_session_id, status, total_amount, items_json, customer_email)
         VALUES (?, ?, 'paid', ?, ?, ?)`,
        [userId, `free_${Date.now()}`, 0, JSON.stringify(enrichedItems), userEmail]
      );
      await markDiscountCodesUsed(appliedDiscountCodes);
      return res.json({ success: true, free_order: true, discount_total: discountCents / 100 });
    }

    const sessionOpts = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: discounted_line_items,
      allow_promotion_codes: true,
      // Use PHP trampoline to bypass LiteSpeed WAF on Stripe return URLs
      // 'ref' instead of 'session_id' â€” LiteSpeed WAF blocks 'session_id' as a suspected session token
      success_url: success_url || `${origin}/stripe-return.php?type=shop&ref={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${origin}/stripe-return.php?type=cancel`,
      metadata: {
        items_json: JSON.stringify(items),
        user_id: userId ? String(userId) : '',
        coupon_code: coupon_code || '',
        gift_code: gift_code || '',
        discount_codes: JSON.stringify(discountSummary),
        discount_total: String(discountCents / 100),
      },
      // Collect shipping address from customer
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ'] },
      // Flat-rate shipping options
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 599, currency: 'usd' },
            display_name: 'Standard Shipping',
            delivery_estimate: { minimum: { unit: 'business_day', value: 5 }, maximum: { unit: 'business_day', value: 10 } },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 1299, currency: 'usd' },
            display_name: 'Express Shipping',
            delivery_estimate: { minimum: { unit: 'business_day', value: 2 }, maximum: { unit: 'business_day', value: 3 } },
          },
        },
      ],
    };
    if (userEmail) sessionOpts.customer_email = userEmail;

    const session = await stripe.checkout.sessions.create(sessionOpts);

    // Save pending order â€” store enriched items (title, price, quantity) not just IDs
    await pool.query(
      `INSERT INTO orders (user_id, stripe_session_id, status, total_amount, items_json, customer_email)
       VALUES (?, ?, 'pending', ?, ?, ?)`,
      [userId, session.id, total, JSON.stringify(enrichedItems.map(item => ({ ...item, discount_codes: discountSummary }))), userEmail]
    );
    await markDiscountCodesUsed(appliedDiscountCodes);

    res.json({ url: session.url, session_id: session.id, discount_total: discountCents / 100 });
  } catch (e) {
    console.error('[Stripe] create-session error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/checkout/verify-session â€” verify payment & mark order paid (called from success screen)
// This is the RELIABLE path â€” does NOT depend on webhooks being configured.
app.post('/api/checkout/verify-session', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'payment_intent'],
    });

    if (session.payment_status !== 'paid') {
      return res.json({ status: session.payment_status, paid: false });
    }

    // Find existing order
    const [[existing]] = await pool.query('SELECT * FROM orders WHERE stripe_session_id = ?', [session_id]);
    if (!existing) {
      // No order row â€” create it (edge case: session outside app)
      const total = (session.amount_total || 0) / 100;
      const metaUserId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
      const shipping = extractStripeShipping(session);
      await pool.query(
        `INSERT INTO orders (user_id, stripe_session_id, status, total_amount, items_json, customer_email, customer_name, stripe_payment_intent)
         VALUES (?, ?, 'paid', ?, ?, ?, ?, ?)`,
        [metaUserId, session_id, total, session.metadata?.items_json || '[]',
         shipping.email, shipping.name, shipping.paymentIntent]
      );
    } else if (existing.status === 'pending') {
      const shipping = extractStripeShipping(session);
      const shippingAddr = shipping.address ? { name: shipping.name, ...shipping.address } : null;
      await pool.query(
        `UPDATE orders SET status = 'paid',
         customer_email = COALESCE(customer_email, ?),
         customer_name  = COALESCE(customer_name, ?),
         stripe_payment_intent = COALESCE(stripe_payment_intent, ?),
         shipping_address_json = ?,
         shipping_method = COALESCE(shipping_method, ?)
         WHERE stripe_session_id = ?`,
        [shipping.email, shipping.name, shipping.paymentIntent,
         shippingAddr ? JSON.stringify(shippingAddr) : null, shipping.shippingMethod, session_id]
      );
    }

    // Link order to logged-in user if not yet linked
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET || 'photohealthy_jwt_secret_2026');
        if (decoded?.userId) {
          await pool.query('UPDATE orders SET user_id = ? WHERE stripe_session_id = ? AND user_id IS NULL', [decoded.userId, session_id]);
        }
      } catch {}
    }

    // Fetch final order and send confirmation email once
    const [[order]] = await pool.query('SELECT * FROM orders WHERE stripe_session_id = ?', [session_id]);
    if (order && !order.confirmation_sent) {
      notifyOrderConfirmation(order).catch(() => {});
      createUserNotification(order.user_id, {
        type: 'order_paid',
        title: 'Order received',
        message: `Order #${order.id} is paid and being prepared.`,
        relatedId: order.id,
      });
      pool.query('UPDATE orders SET confirmation_sent = 1 WHERE id = ?', [order.id]).catch(() => {});
    }

    res.json({ status: 'paid', paid: true, order_id: order?.id });
  } catch (e) {
    console.error('[Stripe] verify-session error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/webhook/stripe â€” Stripe webhook handler
app.post('/api/webhook/stripe', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    // req.body may be a Buffer (if raw middleware ran first) or already-parsed object (if json ran first)
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // No webhook secret â€” accept without signature (dev/test mode)
      event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
    }
  } catch (e) {
    console.error('[Stripe webhook] signature error:', e.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const metaUserId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;

      if (session.metadata?.type === 'subscription') {
        // â”€â”€ Subscription payment â”€â”€
        if (metaUserId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const endsAt = new Date(sub.current_period_end * 1000);
          await pool.query(
            `UPDATE users SET subscription_status = 'active', stripe_subscription_id = ?, subscription_ends_at = ?, stripe_customer_id = COALESCE(stripe_customer_id, ?), subscription_started_at = COALESCE(subscription_started_at, NOW()) WHERE id = ?`,
            [session.subscription, endsAt, session.customer, metaUserId]
          );
          console.log('[Stripe] Subscription activated for user', metaUserId);
          // Send activation email
          const [[u]] = await pool.query('SELECT name, email FROM users WHERE id = ?', [metaUserId]).catch(() => [[]]);
          if (u) notifySubscription({ type: 'activated', email: u.email, name: u.name, renews_at: endsAt.toISOString() }).catch(() => {});
          logSubEvent(metaUserId, 'stripe_activate', `Stripe subscription activated (sub: ${session.subscription})`, 9.99);
        }
      } else {
        // â”€â”€ One-time shop order payment â”€â”€
        const shipping = extractStripeShipping(session);
        const shippingAddr = shipping.address ? JSON.stringify({ name: shipping.name, ...shipping.address }) : null;
        await pool.query(
          `UPDATE orders SET status = 'paid', stripe_payment_intent = ?, customer_email = ?,
           customer_name = ?, user_id = COALESCE(user_id, ?),
           shipping_address_json = COALESCE(shipping_address_json, ?),
           shipping_method = COALESCE(shipping_method, ?)
           WHERE stripe_session_id = ?`,
          [shipping.paymentIntent, shipping.email,
           shipping.name, metaUserId, shippingAddr, shipping.shippingMethod, session.id]
        );
        console.log('[Stripe] Order paid:', session.id);
        const [[order]] = await pool.query('SELECT * FROM orders WHERE stripe_session_id = ?', [session.id]).catch(() => [[]]);
        if (order) {
          createUserNotification(order.user_id || metaUserId, {
            type: 'order_paid',
            title: 'Order received',
            message: `Order #${order.id} is paid and being prepared.`,
            relatedId: order.id,
          });
        }
      }
    } catch (e) {
      console.error('[Stripe webhook] checkout.session.completed error:', e.message);
    }
  }

  // Subscription renewed / updated
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    try {
      const isActive = sub.status === 'active';
      const endsAt = new Date(sub.current_period_end * 1000);
      await pool.query(
        `UPDATE users SET subscription_status = ?, subscription_ends_at = ? WHERE stripe_subscription_id = ?`,
        [isActive ? 'active' : 'free', endsAt, sub.id]
      );
      console.log('[Stripe] Subscription updated:', sub.id, sub.status);
    } catch (e) {
      console.error('[Stripe webhook] subscription.updated error:', e.message);
    }
  }

  // Renewal invoice paid (send renewal confirmation email)
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    try {
      // Only send for renewals (billing_reason = 'subscription_cycle'), not the first payment
      if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
        const [[u]] = await pool.query('SELECT name, email, subscription_ends_at FROM users WHERE stripe_subscription_id = ?', [invoice.subscription]).catch(() => [[]]);
        if (u) {
          const amount = invoice.amount_paid ? `$${(invoice.amount_paid / 100).toFixed(2)}` : '$9.99';
          notifySubscription({ type: 'renewed', email: u.email, name: u.name, renews_at: u.subscription_ends_at, amount }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('[Stripe webhook] invoice.payment_succeeded error:', e.message);
    }
  }

  // Subscription cancelled / expired
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    try {
      const [[u]] = await pool.query('SELECT name, email FROM users WHERE stripe_subscription_id = ?', [sub.id]).catch(() => [[]]);
      await pool.query(
        `UPDATE users SET subscription_status = 'free', stripe_subscription_id = NULL, subscription_ends_at = NULL WHERE stripe_subscription_id = ?`,
        [sub.id]
      );
      console.log('[Stripe] Subscription ended:', sub.id);
      if (u) notifySubscription({ type: 'ended', email: u.email, name: u.name }).catch(() => {});
    } catch (e) {
      console.error('[Stripe webhook] subscription.deleted error:', e.message);
    }
  }

  // Payment failed
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    try {
      if (invoice.subscription) {
        await pool.query(
          `UPDATE users SET subscription_status = 'past_due' WHERE stripe_subscription_id = ?`,
          [invoice.subscription]
        );
        console.log('[Stripe] Invoice payment failed for subscription:', invoice.subscription);
        const [[u]] = await pool.query('SELECT name, email FROM users WHERE stripe_subscription_id = ?', [invoice.subscription]).catch(() => [[]]);
        if (u) notifySubscription({ type: 'payment_failed', email: u.email, name: u.name }).catch(() => {});
      }
    } catch (e) {
      console.error('[Stripe webhook] invoice.payment_failed error:', e.message);
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    if (session.metadata?.type !== 'subscription') {
      await pool.query(
        `UPDATE orders SET status = 'failed' WHERE stripe_session_id = ? AND status = 'pending'`,
        [session.id]
      ).catch(() => {});
    }
  }

  res.json({ received: true });
});

// GET /api/checkout/session/:id â€” verify session status (for success page)
app.get('/api/checkout/session/:id', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    const [rows] = await pool.query('SELECT * FROM orders WHERE stripe_session_id = ?', [req.params.id]);
    res.json({ session: { status: session.payment_status, customer_email: session.customer_email }, order: rows[0] || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper â€” send order status email via PHP mailer
async function notifyOrderStatus({ order, type }) {
  try {
    const toEmail = order.customer_email;
    if (!toEmail) return;
    const [[fromSetting]] = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'notification_from_email'").catch(() => [[]]);
    const fromEmail = fromSetting?.setting_value || 'noreply@photoai.betaplanets.com';

    const payload = JSON.stringify({ order, type, from_email: fromEmail });
    const http = require('http');
    const opts = {
      hostname: 'localhost', port: 80,
      path: '/notify-order.php', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    };
    const phpReq = http.request(opts, phpRes => {
      let body = '';
      phpRes.on('data', d => body += d);
      phpRes.on('end', () => console.log('[notify-order] PHP:', body.slice(0, 200)));
    });
    phpReq.on('error', e => console.error('[notify-order] error:', e.message));
    phpReq.write(payload);
    phpReq.end();
  } catch (e) {
    console.error('[notify-order]', e.message);
  }
}

// GET /api/admin/orders â€” admin view all orders (active + archived)
app.get('/api/admin/orders', adminAuth, async (req, res) => {
  try {
    const archivedParam = req.query.archived;
    const { sort, filter, search } = req.query;

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    if (archivedParam === '1') query += ' AND archived = 1';
    else if (archivedParam === '0') query += ' AND archived = 0';

    // Status filter
    if (filter && filter !== 'all') {
      query += ' AND status = ?'; params.push(filter);
    }
    // Search by customer name/email
    if (search) {
      query += ' AND (customer_name LIKE ? OR customer_email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sort
    const sortMap = {
      newest: 'ORDER BY created_at DESC',
      oldest: 'ORDER BY created_at ASC',
      customer: 'ORDER BY customer_name ASC, customer_email ASC',
      amount_high: 'ORDER BY total_amount DESC',
      amount_low: 'ORDER BY total_amount ASC',
    };
    query += ' ' + (sortMap[sort] || sortMap.newest) + ' LIMIT 500';

    const [rows] = await pool.query(query, params);
    const rowsWithShipping = [];
    for (const row of rows) {
      rowsWithShipping.push(await backfillOrderShippingFromStripe(row));
    }

    // Add Stripe payment link to each order
    const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
    const isTest = STRIPE_KEY.startsWith('sk_test_');
    const stripeBase = isTest
      ? 'https://dashboard.stripe.com/test/payments/'
      : 'https://dashboard.stripe.com/payments/';

    const enriched = rowsWithShipping.map(o => ({
      ...o,
      stripe_payment_url: o.stripe_payment_intent ? stripeBase + o.stripe_payment_intent : null,
    }));

    res.json({ orders: enriched });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/orders/:id/mark-paid â€” admin manually marks a pending order as paid
app.patch('/api/admin/orders/:id/mark-paid', adminAuth, async (req, res) => {
  try {
    const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Order is not in pending state' });
    await pool.query(`UPDATE orders SET status = 'paid' WHERE id = ?`, [req.params.id]);
    // Send confirmation email if not already sent
    if (!order.confirmation_sent) {
      const updated = { ...order, status: 'paid' };
      notifyOrderConfirmation(updated).catch(() => {});
      createUserNotification(order.user_id, {
        type: 'order_paid',
        title: 'Order received',
        message: `Order #${order.id} is paid and being prepared.`,
        relatedId: order.id,
      });
      pool.query('UPDATE orders SET confirmation_sent = 1 WHERE id = ?', [req.params.id]).catch(() => {});
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/orders/:id/process â€” mark as processed (packed/ready to ship), notify customer
// Process order handler (shared for both PATCH and POST â€” LiteSpeed blocks PATCH)
async function handleOrderProcess(req, res) {
  try {
    await pool.query(
      "UPDATE orders SET status = 'processed', updated_at = NOW() WHERE id = ? AND status IN ('paid','pending')",
      [req.params.id]
    );
    const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (order) notifyOrderStatus({ order, type: 'processed' });
    if (order) createUserNotification(order.user_id, {
      type: 'order_processed',
      title: 'Order packed',
      message: `Order #${order.id} has been packed and is ready to ship.`,
      relatedId: order.id,
    });
    res.json({ ok: true, order });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
app.patch('/api/admin/orders/:id/process', adminAuth, handleOrderProcess);
app.post('/api/admin/orders/:id/process', adminAuth, handleOrderProcess);

// Fulfill/ship order handler (shared for PATCH and POST)
async function handleOrderFulfill(req, res) {
  try {
    const { tracking_number } = req.body;
    const now = new Date();
    await pool.query(
      "UPDATE orders SET status = 'fulfilled', tracking_number = ?, fulfilled_at = ?, archived = 0, updated_at = NOW() WHERE id = ?",
      [tracking_number || null, now, req.params.id]
    );
    const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (order) notifyOrderStatus({ order, type: 'shipped' });
    if (order) createUserNotification(order.user_id, {
      type: 'order_shipped',
      title: 'Order shipped',
      message: `Order #${order.id} has shipped${tracking_number ? ` with tracking ${tracking_number}` : ''}.`,
      relatedId: order.id,
    });
    res.json({ ok: true, order });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
app.patch('/api/admin/orders/:id/fulfill', adminAuth, handleOrderFulfill);
app.post('/api/admin/orders/:id/fulfill', adminAuth, handleOrderFulfill);

// PATCH /api/admin/orders/:id/tracking â€” add/update tracking number on an already-fulfilled order
app.patch('/api/admin/orders/:id/tracking', adminAuth, async (req, res) => {
  try {
    const { tracking_number } = req.body;
    if (!tracking_number) return res.status(400).json({ error: 'tracking_number required' });
    await pool.query('UPDATE orders SET tracking_number = ?, updated_at = NOW() WHERE id = ?', [tracking_number, req.params.id]);
    const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (order) notifyOrderStatus({ order, type: 'tracking_updated' });
    if (order) createUserNotification(order.user_id, {
      type: 'tracking_updated',
      title: 'Tracking updated',
      message: `Tracking was updated for order #${order.id}: ${tracking_number}.`,
      relatedId: order.id,
    });
    res.json({ ok: true, order });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/orders/:id/archive â€” move to archive (fulfilled orders only)
app.patch('/api/admin/orders/:id/archive', adminAuth, async (req, res) => {
  try {
    await pool.query('UPDATE orders SET archived = 1, updated_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Discount Codes API

app.get('/api/admin/discount-codes', adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM discount_codes ORDER BY created_at DESC');
    res.json({ discount_codes: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/discount-codes', adminAuth, async (req, res) => {
  try {
    const {
      code, kind = 'coupon', discount_type = 'amount', value,
      min_subtotal, max_uses, starts_at, expires_at, is_active = true,
    } = req.body;
    const normalized = normalizeDiscountCode(code);
    const parsedValue = Number(String(value ?? '').replace(/[$,%]/g, '').trim());
    if (!normalized) return res.status(400).json({ error: 'Code is required' });
    if (!['coupon', 'gift'].includes(kind)) return res.status(400).json({ error: 'Type must be coupon or gift' });
    if (!['percent', 'amount'].includes(discount_type)) return res.status(400).json({ error: 'Discount must be percent or amount' });
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) return res.status(400).json({ error: 'Discount value must be greater than 0' });
    if (discount_type === 'percent' && parsedValue > 100) return res.status(400).json({ error: 'Percent discount cannot be over 100' });

    const [result] = await pool.query(
      `INSERT INTO discount_codes
       (code, kind, discount_type, value, min_subtotal, max_uses, starts_at, expires_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalized,
        kind,
        discount_type,
        parsedValue,
        min_subtotal ? Number(min_subtotal) : null,
        max_uses ? parseInt(max_uses) : null,
        parseNullableDate(starts_at),
        parseNullableDate(expires_at),
        is_active ? 1 : 0,
      ]
    );
    const [[created]] = await pool.query('SELECT * FROM discount_codes WHERE id = ?', [result.insertId]);
    res.json({ discount_code: created });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'That code already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/admin/discount-codes/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['code', 'kind', 'discount_type', 'value', 'min_subtotal', 'max_uses', 'starts_at', 'expires_at', 'is_active'];
    const fields = [];
    const vals = [];
    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      let value = req.body[key];
      if (key === 'code') value = normalizeDiscountCode(value);
      if (key === 'kind' && !['coupon', 'gift'].includes(value)) return res.status(400).json({ error: 'Type must be coupon or gift' });
      if (key === 'discount_type' && !['percent', 'amount'].includes(value)) return res.status(400).json({ error: 'Discount must be percent or amount' });
      if (key === 'value') {
        value = Number(String(value ?? '').replace(/[$,%]/g, '').trim());
        if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Discount value must be greater than 0' });
      }
      if (key === 'min_subtotal') value = value === '' || value == null ? null : Number(value);
      if (key === 'max_uses') value = value === '' || value == null ? null : parseInt(value);
      if (key === 'starts_at' || key === 'expires_at') value = parseNullableDate(value);
      if (key === 'is_active') value = value ? 1 : 0;
      fields.push(`${key} = ?`);
      vals.push(value);
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.id);
    await pool.query(`UPDATE discount_codes SET ${fields.join(', ')} WHERE id = ?`, vals);
    const [[updated]] = await pool.query('SELECT * FROM discount_codes WHERE id = ?', [req.params.id]);
    res.json({ discount_code: updated });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'That code already exists' });
    res.status(500).json({ error: e.message });
  }
});

async function handleDeleteDiscountCode(req, res) {
  try {
    await pool.query('DELETE FROM discount_codes WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
app.delete('/api/admin/discount-codes/:id', adminAuth, handleDeleteDiscountCode);
app.post('/api/admin/discount-codes/:id/delete', adminAuth, handleDeleteDiscountCode);

// â”€â”€ Products API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/products â€” public, with optional search/category/featured filter
app.get('/api/products', async (req, res) => {
  try {
    const { search, category, featured } = req.query;
    let sql = 'SELECT * FROM products WHERE is_active = TRUE';
    const params = [];
    if (search) { sql += ' AND title LIKE ?'; params.push(`%${search}%`); }
    if (category && category !== 'All Categories') { sql += ' AND category = ?'; params.push(category); }
    if (featured === '1') { sql += ' AND featured = TRUE'; }
    sql += ' ORDER BY featured DESC, created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ products: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/products/:id â€” public
app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND is_active = TRUE', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/products â€” admin only, create product
app.post('/api/admin/products', adminAuth, async (req, res) => {
  try {
    const { title, description, price, category, sizes, stock, image_url, emoji, badge, featured, is_active, is_pro_only } = req.body;
    const parsedPrice = Number(String(price ?? '').replace(/[$,]/g, '').trim());
    if (!title || !Number.isFinite(parsedPrice) || parsedPrice < 0) return res.status(400).json({ error: 'title and valid price required' });
    const [result] = await pool.query(
      `INSERT INTO products (title, description, price, category, sizes, stock, image_url, emoji, badge, featured, is_active, is_pro_only)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, parsedPrice, category || null, sizes || null,
       stock != null ? parseInt(stock) : null, image_url || null, emoji || null, badge || null,
       featured ? 1 : 0, is_active !== false ? 1 : 0, is_pro_only ? 1 : 0]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.json({ product: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/products/:id â€” admin only, update product
app.patch('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, price, category, sizes, stock, image_url, emoji, badge, featured, is_active, is_pro_only } = req.body;
    const fields = [];
    const vals = [];
    if (title !== undefined) { fields.push('title = ?'); vals.push(title); }
    if (description !== undefined) { fields.push('description = ?'); vals.push(description); }
    if (price !== undefined) {
      const parsedPrice = Number(String(price ?? '').replace(/[$,]/g, '').trim());
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return res.status(400).json({ error: 'valid price required' });
      fields.push('price = ?'); vals.push(parsedPrice);
    }
    if (category !== undefined) { fields.push('category = ?'); vals.push(category); }
    if (sizes !== undefined) { fields.push('sizes = ?'); vals.push(sizes); }
    if (stock !== undefined) { fields.push('stock = ?'); vals.push(stock != null ? parseInt(stock) : null); }
    if (image_url !== undefined) { fields.push('image_url = ?'); vals.push(image_url); }
    if (emoji !== undefined) { fields.push('emoji = ?'); vals.push(emoji); }
    if (badge !== undefined) { fields.push('badge = ?'); vals.push(badge); }
    if (featured !== undefined) { fields.push('featured = ?'); vals.push(featured ? 1 : 0); }
    if (is_active !== undefined) { fields.push('is_active = ?'); vals.push(is_active ? 1 : 0); }
    if (is_pro_only !== undefined) { fields.push('is_pro_only = ?'); vals.push(is_pro_only ? 1 : 0); }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, vals);
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json({ product: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/products/:id â€” admin only (soft delete)
async function handleDeleteProduct(req, res) {
  try {
    await pool.query('UPDATE products SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
app.delete('/api/admin/products/:id', adminAuth, handleDeleteProduct);
app.post('/api/admin/products/:id/delete', adminAuth, handleDeleteProduct);

// GET /api/admin/products â€” admin only, includes inactive
app.get('/api/admin/products', adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ products: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== PARTNER INQUIRIES ====================

// POST /api/partner-inquiries â€” public submission
app.post('/api/partner-inquiries', async (req, res) => {
  try {
    const { name, company, email, phone, partnership_type, message } = req.body;
    if (!name || !company || !email) return res.status(400).json({ error: 'Name, company and email are required' });
    await pool.query(
      'INSERT INTO partner_inquiries (name, company, email, phone, partnership_type, message) VALUES (?, ?, ?, ?, ?, ?)',
      [name, company, email, phone || null, partnership_type || 'other', message || null]
    );
    console.log(`[partners] New inquiry from ${name} @ ${company} <${email}>`);
    res.json({ ok: true });
  } catch (e) {
    console.error('[partners]', e.message);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

// GET /api/admin/partner-inquiries â€” admin only
app.get('/api/admin/partner-inquiries', adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM partner_inquiries ORDER BY created_at DESC');
    res.json({ inquiries: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/partner-inquiries/:id â€” update status
app.patch('/api/admin/partner-inquiries/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE partner_inquiries SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== APP SETTINGS ====================

// GET all settings (admin only)
// GET /api/settings/public â€” public-readable app settings (quote, etc.)
app.get('/api/settings/public', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('motivational_quote','quotes_list','partner_notes_list','free_submission_limit')`
    );
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    // Defaults
    if (!settings.motivational_quote) {
      settings.motivational_quote = 'Every photo tells a story. Make yours worth telling.';
    }
    if (!settings.quotes_list) {
      settings.quotes_list = JSON.stringify([
        'Every photo tells a story. Make yours worth telling.',
        'Movement is medicine. Capture yours.',
        'Wellness is not a destination, it is a journey. Keep moving.',
        'Small steps every day lead to big changes.',
        'Your wellness journey is uniquely yours. Celebrate every step.',
      ]);
    }
    if (!settings.partner_notes_list) {
      settings.partner_notes_list = JSON.stringify([]);
    }
    res.json({ settings });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/settings', adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM app_settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json({ settings });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update a setting (admin only)
app.put('/api/admin/settings', adminAuth, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });
    await pool.query(
      'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()',
      [key, value, value]
    );
    res.json({ ok: true, key, value });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== CONTACT FORM ====================

// POST contact form submission (public)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required' });

    // Save to DB
    await pool.query(
      'INSERT INTO contact_submissions (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || '', message]
    );

    // Get configured contact email
    const [[setting]] = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'contact_email'").catch(() => [[]]);
    const toEmail = setting?.setting_value || 'hello@photohealthy.com';

    console.log(`[contact] New submission from ${name} <${email}> â†’ forwarding to ${toEmail}`);

    res.json({ ok: true, message: 'Message received! We\'ll get back to you soon.' });
  } catch (e) {
    console.error('[contact]', e.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/orders/bundle â€” user bundles their own paid orders to ship together
app.post('/api/orders/bundle', auth, async (req, res) => {
  try {
    const { order_ids, note } = req.body;
    if (!Array.isArray(order_ids) || order_ids.length < 2) {
      return res.status(400).json({ error: 'Select at least 2 orders to bundle' });
    }
    // Verify all orders belong to this user and are paid/not-yet-fulfilled
    const [orders] = await pool.query(
      `SELECT id, status, bundle_id FROM orders WHERE id IN (?) AND (user_id = ? OR customer_email = ?)`,
      [order_ids, req.user.id, req.user.email]
    );
    if (orders.length !== order_ids.length) {
      return res.status(403).json({ error: 'Some orders not found or not yours' });
    }
    const bad = orders.filter(o => !['paid', 'pending'].includes(o.status));
    if (bad.length) {
      return res.status(400).json({ error: 'Only paid orders can be bundled (fulfilled orders cannot be changed)' });
    }
    // Reuse existing bundle_id if any, or create new one
    const existingBundle = orders.find(o => o.bundle_id)?.bundle_id;
    const bundleId = existingBundle || require('crypto').randomUUID();
    await pool.query(
      `UPDATE orders SET bundle_id = ?, bundle_note = COALESCE(?, bundle_note) WHERE id IN (?)`,
      [bundleId, note || null, order_ids]
    );
    res.json({ success: true, bundle_id: bundleId, count: order_ids.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/orders/bundle/:orderId â€” remove one order from its bundle
app.delete('/api/orders/bundle/:orderId', auth, async (req, res) => {
  try {
    const [[order]] = await pool.query(
      `SELECT id, bundle_id FROM orders WHERE id = ? AND (user_id = ? OR customer_email = ?)`,
      [req.params.orderId, req.user.id, req.user.email]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await pool.query('UPDATE orders SET bundle_id = NULL, bundle_note = NULL WHERE id = ?', [order.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/orders/bundle/:bundleId/fulfill â€” fulfill all orders in a bundle
app.patch('/api/admin/orders/bundle/:bundleId/fulfill', adminAuth, async (req, res) => {
  try {
    const { tracking_number } = req.body;
    const [orders] = await pool.query(
      `SELECT id, customer_email, customer_name, items_json, total_amount FROM orders WHERE bundle_id = ? AND status != 'archived'`,
      [req.params.bundleId]
    );
    if (!orders.length) return res.status(404).json({ error: 'Bundle not found' });
    await pool.query(
      `UPDATE orders SET status = 'fulfilled', tracking_number = ?, fulfilled_at = NOW(), archived = 0 WHERE bundle_id = ?`,
      [tracking_number || null, req.params.bundleId]
    );
    // Notify each customer
    for (const order of orders) {
      if (order.customer_email) {
        notifyOrderFulfilled({ ...order, tracking_number }).catch(() => {});
      }
    }
    res.json({ success: true, fulfilled: orders.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/dashboard-stats â€” overview numbers for the admin dashboard
app.get('/api/admin/dashboard-stats', adminAuth, async (req, res) => {
  try {
    const PRO_PRICE = 9.99;
    const [[{ totalUsers }]]       = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ proUsers }]]         = await pool.query(`SELECT COUNT(*) as proUsers FROM users WHERE subscription_status = 'active'`);
    const [[{ todayLogins }]]      = await pool.query(`SELECT COUNT(*) as todayLogins FROM users WHERE DATE(last_login_at) = CURDATE()`);
    const [[{ todaySubmissions }]] = await pool.query(`SELECT COUNT(*) as todaySubmissions FROM submissions WHERE DATE(created_at) = CURDATE()`);
    const [[storeToday]]   = await pool.query(`SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as rev FROM orders WHERE DATE(created_at) = CURDATE() AND status IN ('paid','fulfilled')`);
    const [[storeMonth]]   = await pool.query(`SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount),0) as rev FROM orders WHERE YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW()) AND status IN ('paid','fulfilled')`);
    const [[orderQueue]]   = await pool.query(`SELECT
      SUM(status IN ('pending','paid','processed')) as active,
      SUM(status = 'pending') as pending,
      SUM(status = 'paid') as paid,
      SUM(status = 'processed') as processed
      FROM orders WHERE archived = 0`);
    const [[{ subsToday }]] = await pool.query(`SELECT COUNT(*) as subsToday FROM users WHERE DATE(subscription_started_at) = CURDATE() AND subscription_status = 'active'`);
    const [[{ subsMonth }]] = await pool.query(`SELECT COUNT(*) as subsMonth FROM users WHERE YEAR(subscription_started_at)=YEAR(NOW()) AND MONTH(subscription_started_at)=MONTH(NOW()) AND subscription_status='active'`);
    const [[{ activeSubs }]] = await pool.query(`SELECT COUNT(*) as activeSubs FROM users WHERE subscription_status = 'active'`);
    res.json({
      users: { total: totalUsers, free: totalUsers - proUsers, pro: proUsers },
      today: {
        logins: todayLogins,
        submissions: todaySubmissions,
        orders: storeToday.cnt,
        storeRevenue: parseFloat(storeToday.rev),
        newSubs: subsToday,
        subRevenue: parseFloat((subsToday * PRO_PRICE).toFixed(2)),
      },
      month: {
        orders: storeMonth.cnt,
        storeRevenue: parseFloat(storeMonth.rev),
        newSubs: subsMonth,
        subRevenue: parseFloat((subsMonth * PRO_PRICE).toFixed(2)),
        mrr: parseFloat((activeSubs * PRO_PRICE).toFixed(2)),
      },
      orders: {
        active: Number(orderQueue.active || 0),
        pending: Number(orderQueue.pending || 0),
        paid: Number(orderQueue.paid || 0),
        processed: Number(orderQueue.processed || 0),
      },
    });
  } catch (e) {
    console.error('[dashboard-stats]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET contact submissions (admin only)
app.get('/api/admin/contact-submissions', adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contact_submissions ORDER BY created_at DESC');
    res.json({ submissions: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH mark contact submission read/replied
app.patch('/api/admin/contact-submissions/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE contact_submissions SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== SPA FALLBACK (must be last) ====================
app.get('*', (req, res) => {
  // Never serve SPA for API routes â€” return 404 JSON instead
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  const indexPath = path.join(__dirname, 'dist-web', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ status: 'Photo Healthy API running', version: '0.1.0' });
  }
});

_keepAlive.unref(); // Allow process to exit on SIGTERM without waiting

// Start server
const server = app.listen(PORT, () => {
  console.log(`Photo Healthy server running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('[server error]', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error('Port in use â€” exiting so cron can restart cleanly');
    process.exit(1);
  }
});


