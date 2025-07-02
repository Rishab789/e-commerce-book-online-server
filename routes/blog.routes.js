const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");

const { uploadBlogs } = require("./../controllers/blogs.controller");

router.post("/uploadBlog", upload.any(), uploadBlogs);

module.exports = router;
