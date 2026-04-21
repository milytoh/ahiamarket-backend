const multer = require("multer");

// Use memory storage (best for cloud uploads like Cloudinary)
const storage = multer.memoryStorage();

// File filter (only allow images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB per file
    files: 3, // max 3 files
  },
  fileFilter,
});

module.exports = upload;
