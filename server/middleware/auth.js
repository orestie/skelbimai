const db = require('../db/database');

// Runs on every request: finds the logged-in user and logs out blocked users
function loadUser(req, res, next) {
  res.locals.currentUser = null;

  if (req.session.userId) {
    const user = db
      .prepare('SELECT id, username, email, role, is_blocked FROM users WHERE id = ?')
      .get(req.session.userId);

    if (user && !user.is_blocked) {
      req.user = user;
      res.locals.currentUser = user;
    } else {
      delete req.session.userId;
    }
  }

  next();
}

function requireLogin(req, res, next) {
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.redirect('/login');
  }
  if (req.user.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Access denied',
      message: 'Only administrators can open this page.',
    });
  }
  next();
}

module.exports = { loadUser, requireLogin, requireAdmin };