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