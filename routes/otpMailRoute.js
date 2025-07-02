const express = require("express");
const router = express.Router();

const sendOtpMail = require("../controllers/otpMail");

router.post("/send_recovery_email", (req, res) => {
  sendOtpMail(req.body)
    .then((response) => res.send(response.message))
    .catch((error) => res.status(500).send(error.message));
});

module.exports = router;
