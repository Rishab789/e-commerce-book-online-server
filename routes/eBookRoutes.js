const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");

const {
  uploadEbook,
  getAllPosts,
  uploadReviewsEbbokById,
} = require("./../controllers/eBooksController");

router.post("/posts/create", upload.any(), uploadEbook);
router.get("/posts", getAllPosts);
// router.post("/uploadReviewsById", upload.any(), uploadReviewsEbbokById);

module.exports = router;
