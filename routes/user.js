const express = require("express");
const router = express.Router();

const User = require("./../models/User");

const { login, signup, passwordReset } = require("../controllers/Auth");
const { auth, isVisitor, isCustomer, isAdmin } = require("../middlewares/auth");

router.post("/login", login);
router.post("/signup", signup);
router.post("/passwordReset", passwordReset);

// Testing Protected Route

router.get("/test", auth, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Protected Route for Test",
  });
});

//Protected Route

router.get("/visitor", auth, isVisitor, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Protected Route for the visitor",
  });
});

router.get("/customer", auth, isCustomer, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Protected route for Customer",
  });
});

router.get("/admin", auth, isAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the Protected route for Admin",
  });
});

module.exports = router;
