const express = require("express");
const router = express.Router();

const upload = require("../middlewares/multer.middleware");

const {
  uploadProducts,
  getProducts,
  uploadReviewsById,
} = require("../controllers/productsController");

router.post("/productsUpload", upload.any(), uploadProducts);
router.post("/uploadReviewsById", upload.any(), uploadReviewsById);
router.get("/getProducts", getProducts);

module.exports = router;
