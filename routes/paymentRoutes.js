const express = require("express");
const router = express.Router();

const {
  payment,
  verify,
  orderPlace,
  getUserOrders,
  cancelOrder,
} = require("./../controllers/paymentGateway");

// router.get("/payment", payment);
router.post("/verify", verify);
router.post("/orderPlace", orderPlace);
router.post("/cancelOrder", cancelOrder);

//SHIPROCKET ROUTES
router.get("/getUserOrders", getUserOrders);

module.exports = router;
