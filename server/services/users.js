const bcrypt = require('bcryptjs');
const db = require('../db/database');

function checkLogin(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get((username || '').trim());

  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return { error: 'Wrong username or password.' };
  }
  if (user.is_blocked) {
    return { error: 'Your account has been blocked by the administrator.' };
  }
  return { user };
}

function registerUser(data) {
  const form = {
    username: (data.username || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
  };
  const password = data.password || '';
  const passwordConfirm = data.passwordConfirm || '';
  const errors = [];

  if (form.username.length < 3 || form.username.length > 30) {
    errors.push('Username must be 3 to 30 characters long.');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
    errors.push('Username can contain only letters, numbers and _.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.push('Please enter a valid email address.');
  }
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }
  if (password !== passwordConfirm) {
    errors.push('Passwords do not match.');
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
    .get(form.username, form.email);
  if (existing) {
    errors.push('This username or email is already taken.');
  }

  if (errors.length > 0) {
    return { errors, form };
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(form.username, form.email, passwordHash);

  return { errors: [], form, userId: Number(result.lastInsertRowid) };
}

module.exports = { checkLogin, registerUser };