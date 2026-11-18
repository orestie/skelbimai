const express = require('express');
const { checkLogin, registerUser } = require('../services/users');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/admin');
  }
  res.render('login', { title: 'Login', error: null, username: '' });
});

router.post('/login', (req, res) => {
  const { user, error } = checkLogin(req.body.username, req.body.password);

  if (error) {
    return res.render('login', { title: 'Login', error, username: req.body.username || '' });
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
  const { errors, form, userId } = registerUser(req.body);

  if (errors.length > 0) {
    return res.render('register', { title: 'Register', errors, form });
  }

  req.session.userId = userId;
  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;