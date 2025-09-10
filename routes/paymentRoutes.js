const express = require("express");
const router = express.Router();

const {
  payment,
  verify,
  orderPlace,
  getUserOrders,
  cancelOrder,
  getTrackingDetails,
} = require("./../controllers/paymentGateway");

const { getShipmentsByUserId } = require("../services/shipmentServices");

// router.get("/payment", payment);
router.post("/verify", verify);
router.post("/orderPlace", orderPlace);
router.post("/cancelOrder", cancelOrder);
router.get("/shipmentId", getTrackingDetails);
router.get("/getTrackingDetails/:user_id", getTrackingDetails);

//SHIPROCKET ROUTES
router.get("/getUserOrders", getUserOrders);

module.exports = router;
