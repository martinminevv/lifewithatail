const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.sqlite');
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database(DB_FILE);

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS animals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      breed TEXT,
      age TEXT,
      gender TEXT,
      species TEXT DEFAULT 'dog',
      description TEXT,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: add species column to existing tables
  db.run(`ALTER TABLE animals ADD COLUMN species TEXT DEFAULT 'dog'`, [], (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Migration error:', err.message);
    }
    // Backfill any rows that have NULL species
    db.run(`UPDATE animals SET species = 'dog' WHERE species IS NULL`);
    // Normalize legacy gender values
    db.run(`UPDATE animals SET gender = 'male' WHERE gender IN ('Male','Мъжко/а','Мъжко')`);
    db.run(`UPDATE animals SET gender = 'female' WHERE gender IN ('Female','Женско/а','Женско')`);
  });

  // User profile fields migration
  db.run(`ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''`, [], (err) => {
    if (err && !err.message.includes('duplicate column')) console.error('Migration phone:', err.message);
  });
  db.run(`ALTER TABLE users ADD COLUMN address TEXT DEFAULT ''`, [], (err) => {
    if (err && !err.message.includes('duplicate column')) console.error('Migration address:', err.message);
  });

  // Favorites table
  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      animal_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, animal_id)
    )
  `);

  // Adoption applications table
  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      animal_id INTEGER NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Contact messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

async function seedAdmin() {
  const adminEmail = 'martinminevv@gmail.com';
  const adminPassword = 'parola1';
  db.get(`SELECT * FROM users WHERE email = ?`, [adminEmail], async (err, row) => {
    if (err) return console.error('Error checking admin:', err);
    if (!row) {
      const hash = await bcrypt.hash(adminPassword, 10);
      db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`,
        ['Admin', adminEmail, hash], function(err2) {
          if (err2) return console.error('Error creating admin:', err2);
          console.log('Admin user created:', adminEmail);
        });
    } else {
      console.log('Admin user already exists:', adminEmail);
    }
  });
}

seedAdmin();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from project root so your existing HTML works
app.use(express.static(path.join(__dirname)));

// Sessions
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: __dirname }),
  secret: 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 24 }
}));

// Helpers
function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'Unauthorized' });
}
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') return next();
  res.status(403).json({ error: 'Forbidden' });
}

// Auth endpoints
app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name || '', email, hash], function(err2) {
      if (err2) {
        if (err2.message && err2.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already in use' });
        return res.status(500).json({ error: 'Could not create user' });
      }
      // Create session
      req.session.user = { id: this.lastID, name: name || '', email, role: 'user' };
      res.json({ id: this.lastID, email, name: name || '', role: 'user' });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!row) return res.status(400).json({ error: 'Invalid credentials' });
    bcrypt.compare(password, row.password, (err2, same) => {
      if (err2) return res.status(500).json({ error: 'Server error' });
      if (!same) return res.status(400).json({ error: 'Invalid credentials' });
      
      // Set session expiry based on "Remember Me"
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }
      
      req.session.user = { id: row.id, name: row.name, email: row.email, role: row.role };
      res.json({ id: row.id, email: row.email, name: row.name, role: row.role });
    });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Could not log out' });
    res.json({ ok: true });
  });
});

app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) return res.json(req.session.user);
  res.status(401).json({ error: 'Not authenticated' });
});

// Animals endpoints
app.get('/api/animals', (req, res) => {
  db.all(`SELECT id, name, breed, age, gender, species, description, image, created_at FROM animals ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Could not fetch animals' });
    res.json(rows);
  });
});

app.post('/api/animals', requireLogin, requireAdmin, (req, res) => {
  const { name, breed, age, gender, species, description, image } = req.body;
  db.run(`INSERT INTO animals (name, breed, age, gender, species, description, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, breed, age, gender, species || 'dog', description, image], function(err) {
      if (err) return res.status(500).json({ error: 'Could not create animal' });
      db.get(`SELECT id, name, breed, age, gender, species, description, image, created_at FROM animals WHERE id = ?`, [this.lastID], (err2, row) => {
        if (err2) return res.status(500).json({ error: 'Could not fetch new animal' });
        res.json(row);
      });
  });
});

app.put('/api/animals/:id', requireLogin, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, breed, age, gender, species, description, image } = req.body;
  db.run(`UPDATE animals SET name=?, breed=?, age=?, gender=?, species=?, description=?, image=? WHERE id=?`,
    [name, breed, age, gender, species || 'dog', description, image, id], function(err) {
      if (err) return res.status(500).json({ error: 'Could not update animal' });
      res.json({ ok: true });
  });
});

app.delete('/api/animals/:id', requireLogin, requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM animals WHERE id=?`, [id], function(err) {
    if (err) return res.status(500).json({ error: 'Could not delete animal' });
    res.json({ ok: true });
  });
});

// Redirect root URL to home page
app.get('/', (req, res) => res.redirect('/home.html'));

// ── User Profile endpoints ──

// Update profile info
app.put('/api/profile', requireLogin, (req, res) => {
  const { name, phone, address } = req.body;
  const userId = req.session.user.id;
  db.run(`UPDATE users SET name=?, phone=?, address=? WHERE id=?`,
    [name || '', phone || '', address || '', userId], function(err) {
      if (err) return res.status(500).json({ error: 'Could not update profile' });
      // Update session
      req.session.user.name = name || '';
      res.json({ ok: true });
  });
});

// Get full profile (including phone/address)
app.get('/api/profile', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  db.get(`SELECT id, name, email, phone, address, role, created_at FROM users WHERE id=?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Could not fetch profile' });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

// ── Favorites endpoints ──

app.get('/api/favorites', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  db.all(`SELECT a.id, a.name, a.breed, a.age, a.gender, a.species, a.image
          FROM favorites f JOIN animals a ON f.animal_id = a.id
          WHERE f.user_id = ? ORDER BY f.created_at DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Could not fetch favorites' });
    res.json(rows);
  });
});

// Get list of favorite animal IDs only (for heart state)
app.get('/api/favorites/ids', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  db.all(`SELECT animal_id FROM favorites WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Could not fetch favorites' });
    res.json(rows.map(r => r.animal_id));
  });
});

app.post('/api/favorites/:animalId', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  const animalId = req.params.animalId;
  db.run(`INSERT OR IGNORE INTO favorites (user_id, animal_id) VALUES (?, ?)`, [userId, animalId], function(err) {
    if (err) return res.status(500).json({ error: 'Could not add favorite' });
    res.json({ ok: true });
  });
});

app.delete('/api/favorites/:animalId', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  const animalId = req.params.animalId;
  db.run(`DELETE FROM favorites WHERE user_id=? AND animal_id=?`, [userId, animalId], function(err) {
    if (err) return res.status(500).json({ error: 'Could not remove favorite' });
    res.json({ ok: true });
  });
});

// ── Applications endpoints ──

// User submits application
app.post('/api/applications', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  const { animal_id, message } = req.body;
  if (!animal_id) return res.status(400).json({ error: 'Animal ID required' });
  // Check for duplicate pending application
  db.get(`SELECT id FROM applications WHERE user_id=? AND animal_id=? AND status IN ('pending','reviewing')`, [userId, animal_id], (err, existing) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (existing) return res.status(400).json({ error: 'You already have an active application for this pet' });
    db.run(`INSERT INTO applications (user_id, animal_id, message) VALUES (?, ?, ?)`,
      [userId, animal_id, message || ''], function(err2) {
        if (err2) return res.status(500).json({ error: 'Could not submit application' });
        res.json({ id: this.lastID, status: 'pending' });
    });
  });
});

// User gets their own applications
app.get('/api/applications', requireLogin, (req, res) => {
  const userId = req.session.user.id;
  db.all(`SELECT ap.id, ap.animal_id, ap.message, ap.status, ap.created_at,
                 a.name as animal_name, a.breed, a.species, a.image
          FROM applications ap JOIN animals a ON ap.animal_id = a.id
          WHERE ap.user_id = ? ORDER BY ap.created_at DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Could not fetch applications' });
    res.json(rows);
  });
});

// Admin: get ALL applications
app.get('/api/admin/applications', requireLogin, requireAdmin, (req, res) => {
  db.all(`SELECT ap.id, ap.user_id, ap.animal_id, ap.message, ap.status, ap.created_at,
                 a.name as animal_name, a.breed, a.species, a.image,
                 u.name as user_name, u.email as user_email, u.phone as user_phone
          FROM applications ap
          JOIN animals a ON ap.animal_id = a.id
          JOIN users u ON ap.user_id = u.id
          ORDER BY ap.created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Could not fetch applications' });
    res.json(rows);
  });
});

// Admin: update application status
app.put('/api/admin/applications/:id', requireLogin, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'reviewing', 'approved', 'declined'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.run(`UPDATE applications SET status=? WHERE id=?`, [status, id], function(err) {
    if (err) return res.status(500).json({ error: 'Could not update application' });
    res.json({ ok: true });
  });
});

// ── Contact Messages endpoints ──

// Public: submit a contact message
app.post('/api/messages', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required' });
  db.run(`INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)`,
    [name, email, phone || '', subject || '', message], function(err) {
      if (err) return res.status(500).json({ error: 'Could not save message' });
      res.json({ id: this.lastID, ok: true });
  });
});

// Admin: get all contact messages
app.get('/api/admin/messages', requireLogin, requireAdmin, (req, res) => {
  db.all(`SELECT * FROM messages ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Could not fetch messages' });
    res.json(rows);
  });
});

// Admin: mark message as read
app.put('/api/admin/messages/:id/read', requireLogin, requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run(`UPDATE messages SET is_read = 1 WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: 'Could not update message' });
    res.json({ ok: true });
  });
});

// Admin: delete a message
app.delete('/api/admin/messages/:id', requireLogin, requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM messages WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: 'Could not delete message' });
    res.json({ ok: true });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
