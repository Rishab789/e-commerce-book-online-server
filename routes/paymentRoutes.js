const express = require("express");
const router = express.Router();

const {
  payment,
  verify,
  orderPlace,
  getUserOrders,
  cancelOrder,
  getTrackingDetails,
  calculateShippingCharges,
  verifyPincodeServiceability,
  getCheapestShippingOption,
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
// SHIPPING CALCULATION ROUTES
router.post("/calculate-shipping", calculateShippingCharges);
router.post("/verify-pincode", verifyPincodeServiceability);
router.post("/cheapest-shipping", getCheapestShippingOption);

module.exports = router;
