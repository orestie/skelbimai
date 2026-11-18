const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      req.uploadError = 'Only JPG, PNG, WEBP or GIF images are allowed.';
      cb(null, false);
    }
  },
});

// Wraps multer so upload errors are shown in the form instead of crashing the page
function uploadImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      req.uploadError =
        err.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 5 MB.' : 'Image upload failed.';
    }
    next();
  });
}

function deleteImage(filename) {
  if (!filename) return;
  fs.unlink(path.join(uploadDir, filename), () => {});
}

module.exports = { uploadImage, deleteImage };