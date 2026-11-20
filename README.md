# Skelbimai – Classifieds Web Application

A web application where users can publish ads for goods and services, search ads, comment on them and save favourite ads.

The application has two connected parts:

- **Admin area** (Node.js + Express + EJS + Bootstrap) – available only to logged-in users.
- **Public site** (React SPA + Bootstrap) – search, comments and favourites. Data comes from the admin area through a **REST API**.

## Technologies

| Part | Technology |
|---|---|
| Backend / admin area | Node.js, Express, EJS templates, Bootstrap 5 |
| Public site | React, React Router, Bootstrap 5, Vite |
| Database | SQLite (built into Node.js, no installation needed) |
| Security | Passwords hashed with bcrypt, sessions with express-session, role-based access |
| Image upload | Multer (JPG, PNG, WEBP, GIF, up to 5 MB) |

## Requirements

- [Node.js](https://nodejs.org/) **22.13 or newer** (LTS version recommended)
- Git

## How to run

```bash
git clone <repository-url>
cd skelbimai
npm run setup
npm start
```

- `npm run setup` – installs all packages and builds the React app (needed only once).
- `npm start` – starts the server.

Then open:

| Address | What it is |
|---|---|
| http://localhost:3000 | Public site (React) |
| http://localhost:3000/admin | Admin area |

On the first start the database is created automatically with demo users, categories, ads, comments and favourites.

## Test accounts

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `admin123` |
| Registered user | `user` | `user123` |
| Registered user | `anna` | `anna123` |

New users can also register on the public site or at http://localhost:3000/admin/register.

## How to test the roles

### Guest (not logged in) – public site
1. Open http://localhost:3000.
2. Search ads by a word or phrase (for example `jacket`) and filter by category.
3. Open an ad to see its details and comments.
4. Clicking the star or trying to comment asks you to log in.
5. Opening http://localhost:3000/admin shows the login page.

### Registered user (`user` / `user123`)
**Public site:**
1. Log in with the **Login** button.
2. Write a comment under any ad – it appears without reloading the page.
3. Click the ☆ star – the ad is saved to **Favorites** (stored in the database).

**Admin area** (button **My account** or http://localhost:3000/admin):
1. **My ads** – create a new ad (title, category, description, price, image), edit or delete your own ads. Wrong data (empty title, negative price, wrong file type) shows validation errors.
2. **Comments** – comments written under your ads. Delete inappropriate ones.
3. **Saved ads** – ads you marked with a star.
4. Ads of other users cannot be edited or deleted.

### Administrator (`admin` / `admin123`)
In the admin area open the yellow **Admin** menu:
1. **Categories** – create new categories, delete empty ones.
2. **Users** – block or unblock users. A blocked user cannot log in.
3. **All ads** – block inappropriate ads. Blocked ads disappear from the public site.
4. **All comments** – block inappropriate comments. Blocked comments disappear from the public site.

A regular user who opens these pages gets an **Access denied** message.

## REST API

| Method | Address | Description |
|---|---|---|
| GET | `/api/categories` | List of categories |
| GET | `/api/ads?category=1&q=phone` | Search ads by category and word or phrase |
| GET | `/api/ads/:id` | One ad with its comments |
| POST | `/api/ads/:id/comments` | Add a comment (login required) |
| GET | `/api/favorites` | Favourite ads of the logged-in user |
| POST / DELETE | `/api/favorites/:adId` | Add / remove an ad from favourites |
| POST | `/api/register`, `/api/login`, `/api/logout` | Registration and login for the React app |
| GET | `/api/me` | Currently logged-in user |

## Database

SQLite database file: `server/db/skelbimai.db`.

| Table | Content | Relations |
|---|---|---|
| `users` | username, email, password hash, role (`admin` / `user`), blocked flag | – |
| `categories` | category name | – |
| `ads` | title, description, price, image, blocked flag | belongs to a `user` and a `category` |
| `comments` | comment text, blocked flag | belongs to an `ad` and a `user` |
| `favorites` | saved ads | connects `users` and `ads` (many-to-many) |

To reset the demo data, stop the server and delete `server/db/skelbimai.db` and the `server/uploads` folder, then run `npm start` again.

## Project structure

```
skelbimai/
├── client/                React public site (SPA)
│   └── src/
│       ├── components/    Navbar, AdCard, FavoriteButton
│       ├── pages/         Home, AdDetails, Favorites, Login, Register
│       ├── api.js         Requests to the REST API
│       └── AuthContext.jsx  Logged-in user state
├── server/                Node.js server and admin area
│   ├── db/                Database tables and demo data
│   ├── middleware/        Login / admin checks, image upload
│   ├── routes/            Admin pages and REST API
│   ├── services/          Login and registration logic
│   ├── views/             EJS pages of the admin area
│   └── app.js             Server entry point
└── package.json           Commands: setup, start
```

## Development mode

To change the code with automatic reload, run two terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

The React app is then available at http://localhost:5173.