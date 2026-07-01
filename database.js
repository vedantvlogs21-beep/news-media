const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'kanosa.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create News Table
      db.run(`CREATE TABLE IF NOT EXISTS news (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        excerpt TEXT,
        content TEXT,
        category TEXT,
        imageUrl TEXT,
        videoUrl TEXT,
        date TEXT,
        author TEXT,
        commentCount INTEGER DEFAULT 0,
        viewCount INTEGER DEFAULT 0
      )`, (err) => {
        if (err) return reject(err);
      });

      // Create Admins Table
      db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )`, async (err) => {
        if (err) return reject(err);

        // Seed default admin if not exists
        const hashedPassword = await bcrypt.hash('Admin@2026', 10);
        db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`, ['admin2407', hashedPassword]);
        resolve();
      });
    });
  });
};

module.exports = { db, initDb };
