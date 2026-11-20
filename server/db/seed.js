const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const uploadDir = path.join(__dirname, '..', 'uploads');

// Creates a simple colourful picture, so demo ads have images without extra files
function createDemoImage(filename, emoji, color1, color2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color1}"/>
      <stop offset="1" stop-color="${color2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <circle cx="400" cy="300" r="190" fill="#ffffff" fill-opacity="0.18"/>
  <text x="400" y="300" font-size="220" text-anchor="middle" dominant-baseline="central">${emoji}</text>
</svg>`;
  fs.writeFileSync(path.join(uploadDir, filename), svg);
  return filename;
}

function seedDemoData(db) {
  const addUser = db.prepare(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  addUser.run('admin', 'admin@example.com', bcrypt.hashSync('admin123', 10), 'admin');
  const userId = addUser.run('user', 'user@example.com', bcrypt.hashSync('user123', 10), 'user').lastInsertRowid;
  const annaId = addUser.run('anna', 'anna@example.com', bcrypt.hashSync('anna123', 10), 'user').lastInsertRowid;

  const addCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const categoryIds = {};
  ['Electronics', 'Vehicles', 'Home & Garden', 'Clothing', 'Services'].forEach((name) => {
    categoryIds[name] = addCategory.run(name).lastInsertRowid;
  });

  fs.mkdirSync(uploadDir, { recursive: true });

  const ads = [
    ['Mountain bike', 'Aluminium frame, 21 gears, new tyres. Perfect for city and forest roads.', 250, 'Vehicles', userId, '🚲', '#0d6efd', '#6610f2'],
    ['Smartphone 128 GB', 'Two years old, works perfectly. Comes with a case and a charger.', 320, 'Electronics', annaId, '📱', '#20c997', '#0d6efd'],
    ['Wooden dining table', 'Solid oak table for 6 people, 180 x 90 cm. Pick up only.', 120, 'Home & Garden', userId, '🪑', '#fd7e14', '#dc3545'],
    ['Winter jacket', 'Warm winter jacket, size M, worn only one season.', 45, 'Clothing', annaId, '🧥', '#6f42c1', '#d63384'],
    ['Laptop for students', '15.6" screen, 16 GB RAM, 512 GB SSD. Great for studying and office work.', 400, 'Electronics', userId, '💻', '#198754', '#20c997'],
    ['Lawn mowing service', 'I will mow your lawn in Vilnius and nearby. Price per hour.', 20, 'Services', annaId, '🌱', '#28a745', '#ffc107'],
  ];

  const addAd = db.prepare(
    `INSERT INTO ads (title, description, price, image, category_id, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const adIds = ads.map(([title, description, price, category, ownerId, emoji, color1, color2], index) => {
    const image = createDemoImage(`demo-${index + 1}.svg`, emoji, color1, color2);
    return addAd.run(title, description, price, image, categoryIds[category], ownerId).lastInsertRowid;
  });

  const addComment = db.prepare('INSERT INTO comments (ad_id, user_id, text) VALUES (?, ?, ?)');
  addComment.run(adIds[0], annaId, 'Hi! Is the price negotiable?');
  addComment.run(adIds[0], userId, 'Yes, a little. Write me a message.');
  addComment.run(adIds[3], userId, 'Is it still available?');

  const addFavorite = db.prepare('INSERT INTO favorites (user_id, ad_id) VALUES (?, ?)');
  addFavorite.run(userId, adIds[3]);
  addFavorite.run(annaId, adIds[4]);

  console.log('Database created with demo data');
}

module.exports = seedDemoData;