const express = require('express');
const db = require('../db/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', requireAdmin, (req, res) => {
  const categories = db
    .prepare(
      `SELECT categories.id, categories.name, COUNT(ads.id) AS adCount
       FROM categories
       LEFT JOIN ads ON ads.category_id = categories.id
       GROUP BY categories.id
       ORDER BY categories.name`
    )
    .all();
  res.render('admin/categories', { title: 'Categories', categories });
});

router.post('/categories', requireAdmin, (req, res) => {
  const name = (req.body.name || '').trim();

  if (name.length < 2 || name.length > 50) {
    req.session.flash = { type: 'danger', text: 'Category name must be 2 to 50 characters long.' };
    return res.redirect('/admin/categories');
  }

  const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
  if (existing) {
    req.session.flash = { type: 'danger', text: 'This category already exists.' };
    return res.redirect('/admin/categories');
  }

  db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
  req.session.flash = { type: 'success', text: `Category "${name}" was created.` };
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const adCount = db.prepare('SELECT COUNT(*) AS count FROM ads WHERE category_id = ?').get(id).count;

  if (adCount > 0) {
    req.session.flash = { type: 'danger', text: 'You cannot delete a category that has ads.' };
    return res.redirect('/admin/categories');
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  req.session.flash = { type: 'success', text: 'Category was deleted.' };
  res.redirect('/admin/categories');
});

router.get('/users', requireAdmin, (req, res) => {
  const users = db
    .prepare(
      `SELECT users.id, users.username, users.email, users.role, users.is_blocked, users.created_at,
              COUNT(ads.id) AS adCount
       FROM users
       LEFT JOIN ads ON ads.user_id = users.id
       GROUP BY users.id
       ORDER BY users.id`
    )
    .all();
  res.render('admin/users', { title: 'Users', users });
});

router.post('/users/:id/toggle-block', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT id, username, role, is_blocked FROM users WHERE id = ?').get(id);

  if (!user) {
    req.session.flash = { type: 'danger', text: 'User not found.' };
    return res.redirect('/admin/users');
  }
  if (user.role === 'admin') {
    req.session.flash = { type: 'danger', text: 'Administrators cannot be blocked.' };
    return res.redirect('/admin/users');
  }

  const newValue = user.is_blocked ? 0 : 1;
  db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(newValue, id);
  req.session.flash = {
    type: 'success',
    text: `User "${user.username}" was ${newValue ? 'blocked' : 'unblocked'}.`,
  };
  res.redirect('/admin/users');
});

module.exports = router;