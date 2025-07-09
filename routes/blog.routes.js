const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");

const { uploadBlogs, getBlogs } = require("./../controllers/blogs.controller");

router.post("/uploadBlog", upload.any(), uploadBlogs);
router.get("/getBlogs", upload.any(), getBlogs);

module.exports = router;
