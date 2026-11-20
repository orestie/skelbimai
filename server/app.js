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
app.use('/admin', authRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/ads', adRoutes);

app.get('/admin', requireLogin, (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    categories: db.prepare('SELECT COUNT(*) AS count FROM categories').get().count,
    ads: db.prepare('SELECT COUNT(*) AS count FROM ads').get().count,
  };
  res.render('dashboard', { title: 'Dashboard', stats });
});

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// Every other address belongs to the React app (SPA), so always send its index.html
app.get('/{*page}', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('React app is not built yet. Run "npm run build" in the project folder.');
    }
  });
});

app.listen(3000, () => {
  console.log('Server started: http://localhost:3000');
});