const express = require("express");
const router = express.Router();

const { payment, verify } = require("./../controllers/paymentGateway");

router.get("/payment", payment);
router.post("/verify", verify);

module.exports = router;
