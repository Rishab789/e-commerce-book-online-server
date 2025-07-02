const express = require("express");
const router = express.Router();

const { getMail } = require("../controllers/getMailData");

router.post("/posts/getMail", getMail);

module.exports = router;
