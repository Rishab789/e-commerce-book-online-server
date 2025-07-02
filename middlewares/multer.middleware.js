const multer = require("multer");

// Setup multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/temp/"); // Path to save files
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Generate unique filename
  },
});

const upload = multer({ storage });

module.exports = upload;
// Use the upload middleware in your route
