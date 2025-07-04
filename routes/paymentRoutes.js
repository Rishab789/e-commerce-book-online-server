const express = require("express");
const router = express.Router();

const { payment } = require("../controllers/paymentGateway");

router.get("/payment", payment);

module.exports = router;
