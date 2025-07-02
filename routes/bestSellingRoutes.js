const express = require("express");
const router = express.Router();
// const upload = require("../config/multerConfig"); // Adjust the path accordingly
const upload = require("../middlewares/multer.middleware");
const { uploadBestSelling } = require("../controllers/BestSellingController");

router.post("/sellingUploaded", upload.any(), uploadBestSelling);

module.exports = router;
