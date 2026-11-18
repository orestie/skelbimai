const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/database');
const { loadUser, requireLogin } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const adRoutes = require('./routes/ads');
const apiRoutes = require('./routes/api');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(
  session({
    secret: 'skelbimai-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
);

app.use(loadUser);

app.use((req, res, next) => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use('/api', apiRoutes);
app.use(authRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/ads', adRoutes);

app.get('/', (req, res) => {
  res.redirect('/admin');
});

app.get('/admin', requireLogin, (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    categories: db.prepare('SELECT COUNT(*) AS count FROM categories').get().count,
    ads: db.prepare('SELECT COUNT(*) AS count FROM ads').get().count,
  };
  res.render('dashboard', { title: 'Dashboard', stats });
});

app.listen(3000, () => {
  console.log('Server started: http://localhost:3000');
});