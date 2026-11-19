const express = require('express');
const db = require('../db/database');
const { requireLogin } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../middleware/upload');

const router = express.Router();

router.use(requireLogin);

function getCategories() {
  return db.prepare('SELECT id, name FROM categories ORDER BY name').all();
}

function validateAd(body) {
  const ad = {
    title: (body.title || '').trim(),
    description: (body.description || '').trim(),
    price: (body.price || '').trim(),
    category_id: Number(body.category_id),
  };
  const errors = [];

  if (ad.title.length < 3 || ad.title.length > 100) {
    errors.push('Title must be 3 to 100 characters long.');
  }
  if (ad.description.length < 10 || ad.description.length > 2000) {
    errors.push('Description must be 10 to 2000 characters long.');
  }
  const price = Number(ad.price);
  if (ad.price === '' || Number.isNaN(price) || price < 0 || price > 10000000) {
    errors.push('Price must be a number from 0 to 10 000 000.');
  }
  const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(ad.category_id);
  if (!category) {
    errors.push('Please choose a category.');
  }

  return { ad, errors };
}

function findOwnAd(req) {
  return db
    .prepare('SELECT * FROM ads WHERE id = ? AND user_id = ?')
    .get(Number(req.params.id), req.user.id);
}

router.get('/', (req, res) => {
  const ads = db
    .prepare(
      `SELECT ads.*, categories.name AS category_name,
              (SELECT COUNT(*) FROM comments WHERE comments.ad_id = ads.id) AS comment_count
       FROM ads
       JOIN categories ON categories.id = ads.category_id
       WHERE ads.user_id = ?
       ORDER BY ads.created_at DESC, ads.id DESC`
    )
    .all(req.user.id);
  res.render('ads/index', { title: 'My ads', ads });
});
router.get('/comments', (req, res) => {
  const comments = db
    .prepare(
      `SELECT comments.id, comments.text, comments.created_at, comments.is_blocked,
              ads.id AS ad_id, ads.title AS ad_title, users.username AS author
       FROM comments
       JOIN ads ON ads.id = comments.ad_id
       JOIN users ON users.id = comments.user_id
       WHERE ads.user_id = ?
       ORDER BY comments.created_at DESC, comments.id DESC`
    )
    .all(req.user.id);
  res.render('ads/comments', { title: 'Comments on my ads', comments });
});

router.post('/comments/:commentId/delete', (req, res) => {
  const comment = db
    .prepare(
      `SELECT comments.id FROM comments
       JOIN ads ON ads.id = comments.ad_id
       WHERE comments.id = ? AND ads.user_id = ?`
    )
    .get(Number(req.params.commentId), req.user.id);

  if (!comment) {
    req.session.flash = { type: 'danger', text: 'Comment not found or it is not under your ad.' };
    return res.redirect('/admin/ads/comments');
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);
  req.session.flash = { type: 'success', text: 'Comment was deleted.' };
  res.redirect('/admin/ads/comments');
});

router.get('/saved', (req, res) => {
  const ads = db
    .prepare(
      `SELECT ads.id, ads.title, ads.price, ads.image, ads.is_blocked,
              categories.name AS category_name, users.username AS author
       FROM favorites
       JOIN ads ON ads.id = favorites.ad_id
       JOIN categories ON categories.id = ads.category_id
       JOIN users ON users.id = ads.user_id
       WHERE favorites.user_id = ?
       ORDER BY ads.created_at DESC, ads.id DESC`
    )
    .all(req.user.id);
  res.render('ads/saved', { title: 'Saved ads', ads });
});

router.post('/saved/:adId/delete', (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND ad_id = ?').run(
    req.user.id,
    Number(req.params.adId)
  );
  req.session.flash = { type: 'success', text: 'Ad was removed from your saved list.' };
  res.redirect('/admin/ads/saved');
});
router.get('/new', (req, res) => {
  res.render('ads/form', {
    title: 'New ad',
    ad: {},
    categories: getCategories(),
    errors: [],
    isEdit: false,
  });
});

router.post('/', uploadImage, (req, res) => {
  const { ad, errors } = validateAd(req.body);

  if (req.uploadError) {
    errors.push(req.uploadError);
  } else if (!req.file) {
    errors.push('Please choose an image.');
  }

  if (errors.length > 0) {
    if (req.file) deleteImage(req.file.filename);
    return res.render('ads/form', {
      title: 'New ad',
      ad,
      categories: getCategories(),
      errors,
      isEdit: false,
    });
  }

  db.prepare(
    `INSERT INTO ads (title, description, price, image, category_id, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(ad.title, ad.description, Number(ad.price), req.file.filename, ad.category_id, req.user.id);

  req.session.flash = { type: 'success', text: 'Your ad was published.' };
  res.redirect('/admin/ads');
});

router.get('/:id/edit', (req, res) => {
  const ad = findOwnAd(req);
  if (!ad) {
    req.session.flash = { type: 'danger', text: 'Ad not found or it is not yours.' };
    return res.redirect('/admin/ads');
  }
  res.render('ads/form', {
    title: 'Edit ad',
    ad,
    categories: getCategories(),
    errors: [],
    isEdit: true,
  });
});

router.post('/:id', uploadImage, (req, res) => {
  const existing = findOwnAd(req);
  if (!existing) {
    if (req.file) deleteImage(req.file.filename);
    req.session.flash = { type: 'danger', text: 'Ad not found or it is not yours.' };
    return res.redirect('/admin/ads');
  }

  const { ad, errors } = validateAd(req.body);
  if (req.uploadError) {
    errors.push(req.uploadError);
  }

  if (errors.length > 0) {
    if (req.file) deleteImage(req.file.filename);
    return res.render('ads/form', {
      title: 'Edit ad',
      ad: { ...ad, id: existing.id, image: existing.image },
      categories: getCategories(),
      errors,
      isEdit: true,
    });
  }

  const image = req.file ? req.file.filename : existing.image;

  db.prepare(
    `UPDATE ads SET title = ?, description = ?, price = ?, image = ?, category_id = ?
     WHERE id = ? AND user_id = ?`
  ).run(ad.title, ad.description, Number(ad.price), image, ad.category_id, existing.id, req.user.id);

  if (req.file) deleteImage(existing.image);

  req.session.flash = { type: 'success', text: 'Your ad was updated.' };
  res.redirect('/admin/ads');
});

router.post('/:id/delete', (req, res) => {
  const ad = findOwnAd(req);
  if (!ad) {
    req.session.flash = { type: 'danger', text: 'Ad not found or it is not yours.' };
    return res.redirect('/admin/ads');
  }

  db.prepare('DELETE FROM ads WHERE id = ?').run(ad.id);
  deleteImage(ad.image);

  req.session.flash = { type: 'success', text: 'Your ad was deleted.' };
  res.redirect('/admin/ads');
});

module.exports = router;