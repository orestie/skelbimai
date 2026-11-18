const express = require('express');
const db = require('../db/database');
const { checkLogin, registerUser } = require('../services/users');

const router = express.Router();

function requireApiLogin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Please log in first.' });
  }
  next();
}

function publicUser(user) {
  return user ? { id: user.id, username: user.username, role: user.role } : null;
}

// Only ads that are not blocked and whose author is not blocked are public
const AD_SELECT = `
  SELECT ads.id, ads.title, ads.description, ads.price, ads.image, ads.created_at,
         ads.category_id, categories.name AS category_name, users.username AS author,
         (SELECT COUNT(*) FROM comments c JOIN users cu ON cu.id = c.user_id
          WHERE c.ad_id = ads.id AND c.is_blocked = 0 AND cu.is_blocked = 0) AS comment_count,
         EXISTS (SELECT 1 FROM favorites f WHERE f.ad_id = ads.id AND f.user_id = ?) AS is_favorite
  FROM ads
  JOIN categories ON categories.id = ads.category_id
  JOIN users ON users.id = ads.user_id
  WHERE ads.is_blocked = 0 AND users.is_blocked = 0
`;

function formatAd(ad) {
  return {
    ...ad,
    image_url: ad.image ? `/uploads/${ad.image}` : null,
    is_favorite: Boolean(ad.is_favorite),
  };
}

function findPublicAd(adId, userId) {
  return db.prepare(`${AD_SELECT} AND ads.id = ?`).get(userId, adId);
}

router.get('/me', (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.post('/login', (req, res) => {
  const { user, error } = checkLogin(req.body.username, req.body.password);
  if (error) {
    return res.status(400).json({ error });
  }
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

router.post('/register', (req, res) => {
  const { errors, userId } = registerUser(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  req.session.userId = userId;
  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(userId);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
  res.json(categories);
});

router.get('/ads', (req, res) => {
  const userId = req.user ? req.user.id : 0;
  let sql = AD_SELECT;
  const params = [userId];

  const categoryId = Number(req.query.category);
  if (categoryId) {
    sql += ' AND ads.category_id = ?';
    params.push(categoryId);
  }

  const search = (req.query.q || '').trim();
  if (search) {
    sql += ' AND (ads.title LIKE ? OR ads.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY ads.created_at DESC, ads.id DESC';

  const ads = db.prepare(sql).all(...params).map(formatAd);
  res.json(ads);
});

router.get('/ads/:id', (req, res) => {
  const userId = req.user ? req.user.id : 0;
  const ad = findPublicAd(Number(req.params.id), userId);
  if (!ad) {
    return res.status(404).json({ error: 'Ad not found.' });
  }

  const comments = db
    .prepare(
      `SELECT comments.id, comments.text, comments.created_at, users.username AS author
       FROM comments
       JOIN users ON users.id = comments.user_id
       WHERE comments.ad_id = ? AND comments.is_blocked = 0 AND users.is_blocked = 0
       ORDER BY comments.created_at, comments.id`
    )
    .all(ad.id);

  res.json({ ...formatAd(ad), comments });
});

router.post('/ads/:id/comments', requireApiLogin, (req, res) => {
  const ad = findPublicAd(Number(req.params.id), req.user.id);
  if (!ad) {
    return res.status(404).json({ error: 'Ad not found.' });
  }

  const text = (req.body.text || '').trim();
  if (text.length < 2 || text.length > 500) {
    return res.status(400).json({ error: 'Comment must be 2 to 500 characters long.' });
  }

  const result = db
    .prepare('INSERT INTO comments (ad_id, user_id, text) VALUES (?, ?, ?)')
    .run(ad.id, req.user.id, text);

  const comment = db
    .prepare(
      `SELECT comments.id, comments.text, comments.created_at, users.username AS author
       FROM comments JOIN users ON users.id = comments.user_id
       WHERE comments.id = ?`
    )
    .get(Number(result.lastInsertRowid));

  res.status(201).json(comment);
});

router.get('/favorites', requireApiLogin, (req, res) => {
  const ads = db
    .prepare(
      `${AD_SELECT} AND ads.id IN (SELECT ad_id FROM favorites WHERE user_id = ?)
       ORDER BY ads.created_at DESC, ads.id DESC`
    )
    .all(req.user.id, req.user.id)
    .map(formatAd);
  res.json(ads);
});

router.post('/favorites/:adId', requireApiLogin, (req, res) => {
  const ad = findPublicAd(Number(req.params.adId), req.user.id);
  if (!ad) {
    return res.status(404).json({ error: 'Ad not found.' });
  }
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, ad_id) VALUES (?, ?)').run(req.user.id, ad.id);
  res.json({ is_favorite: true });
});

router.delete('/favorites/:adId', requireApiLogin, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND ad_id = ?').run(
    req.user.id,
    Number(req.params.adId)
  );
  res.json({ is_favorite: false });
});

router.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

module.exports = router;