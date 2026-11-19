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

router.get('/all-ads', requireAdmin, (req, res) => {
  const ads = db
    .prepare(
      `SELECT ads.id, ads.title, ads.price, ads.image, ads.is_blocked, ads.created_at,
              categories.name AS category_name, users.username AS author
       FROM ads
       JOIN categories ON categories.id = ads.category_id
       JOIN users ON users.id = ads.user_id
       ORDER BY ads.created_at DESC, ads.id DESC`
    )
    .all();
  res.render('admin/ads', { title: 'All ads', ads });
});

router.post('/all-ads/:id/toggle-block', requireAdmin, (req, res) => {
  const ad = db.prepare('SELECT id, title, is_blocked FROM ads WHERE id = ?').get(Number(req.params.id));
  if (!ad) {
    req.session.flash = { type: 'danger', text: 'Ad not found.' };
    return res.redirect('/admin/all-ads');
  }

  const newValue = ad.is_blocked ? 0 : 1;
  db.prepare('UPDATE ads SET is_blocked = ? WHERE id = ?').run(newValue, ad.id);
  req.session.flash = {
    type: 'success',
    text: `Ad "${ad.title}" was ${newValue ? 'blocked' : 'unblocked'}.`,
  };
  res.redirect('/admin/all-ads');
});

router.get('/all-comments', requireAdmin, (req, res) => {
  const comments = db
    .prepare(
      `SELECT comments.id, comments.text, comments.created_at, comments.is_blocked,
              ads.id AS ad_id, ads.title AS ad_title, users.username AS author
       FROM comments
       JOIN ads ON ads.id = comments.ad_id
       JOIN users ON users.id = comments.user_id
       ORDER BY comments.created_at DESC, comments.id DESC`
    )
    .all();
  res.render('admin/comments', { title: 'All comments', comments });
});

router.post('/all-comments/:id/toggle-block', requireAdmin, (req, res) => {
  const comment = db
    .prepare('SELECT id, is_blocked FROM comments WHERE id = ?')
    .get(Number(req.params.id));
  if (!comment) {
    req.session.flash = { type: 'danger', text: 'Comment not found.' };
    return res.redirect('/admin/all-comments');
  }

  const newValue = comment.is_blocked ? 0 : 1;
  db.prepare('UPDATE comments SET is_blocked = ? WHERE id = ?').run(newValue, comment.id);
  req.session.flash = {
    type: 'success',
    text: `Comment was ${newValue ? 'blocked' : 'unblocked'}.`,
  };
  res.redirect('/admin/all-comments');
});

module.exports = router;