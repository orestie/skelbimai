const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const db = new DatabaseSync(path.join(__dirname, 'skelbimai.db'));

db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_blocked    INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS ads (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL,
    price       REAL    NOT NULL CHECK (price >= 0),
    image       TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_blocked  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id      INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text       TEXT    NOT NULL,
    is_blocked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_id   INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, ad_id)
  );
`);

const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;

if (userCount === 0) {
  const addUser = db.prepare(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  addUser.run('admin', 'admin@example.com', bcrypt.hashSync('admin123', 10), 'admin');
  addUser.run('user', 'user@example.com', bcrypt.hashSync('user123', 10), 'user');

  const addCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
  ['Electronics', 'Vehicles', 'Home & Garden', 'Clothing', 'Services'].forEach((name) =>
    addCategory.run(name)
  );

  console.log('Database created with test users and categories');
}

module.exports = db;