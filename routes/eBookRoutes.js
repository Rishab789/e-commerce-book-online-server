const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");

const {
  uploadEbook,
  getAllPosts,
} = require("./../controllers/eBooksController");

router.post("/posts/create", upload.any(), uploadEbook);
router.get("/posts", getAllPosts);

module.exports = router;
