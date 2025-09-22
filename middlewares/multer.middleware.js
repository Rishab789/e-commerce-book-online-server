// middlewares/multer.middleware.js
const multer = require("multer");

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

module.exports = upload;
