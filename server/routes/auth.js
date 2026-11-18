const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/admin');
  }
  res.render('login', { title: 'Login', error: null, username: '' });
});

router.post('/login', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.render('login', {
      title: 'Login',
      error: 'Wrong username or password.',
      username,
    });
  }

  if (user.is_blocked) {
    return res.render('login', {
      title: 'Login',
      error: 'Your account has been blocked by the administrator.',
      username,
    });
  }

  req.session.userId = user.id;
  res.redirect('/admin');
});

router.get('/register', (req, res) => {
  if (req.user) {
    return res.redirect('/admin');
  }
  res.render('register', { title: 'Register', errors: [], form: {} });
});

router.post('/register', (req, res) => {
  const form = {
    username: (req.body.username || '').trim(),
    email: (req.body.email || '').trim().toLowerCase(),
  };
  const password = req.body.password || '';
  const passwordConfirm = req.body.passwordConfirm || '';

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
    return res.render('register', { title: 'Register', errors, form });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(form.username, form.email, passwordHash);

  req.session.userId = Number(result.lastInsertRowid);
  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;