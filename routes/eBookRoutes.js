const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");

const {
  uploadEbook,
  getAllPosts,
  uploadReviewsEbookById,
} = require("./../controllers/eBooksController");

router.post("/posts/create", upload.any(), uploadEbook);
router.get("/posts", getAllPosts);
router.post("/uploadReviewsEbookById", upload.any(), uploadReviewsEbookById);
// router.post("/uploadReviewsById", upload.any(), uploadReviewsEbbokById);

module.exports = router;
