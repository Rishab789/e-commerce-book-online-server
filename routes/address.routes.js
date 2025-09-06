const express = require("express");
const router = express.Router();

const {
  addAddress,
  getAddresses,
  deleteAddress,
  updateAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

// 📌 Routes
router.post("/addAddress", addAddress); // Add new address
router.get("/getAddresses/:id", getAddresses); // Get all addresses for logged-in user
router.delete("/deleteAddress/:id", deleteAddress); // Delete address by ID
router.put("/updateAddress/:id", updateAddress); // Update address by ID
router.patch("/setDefaultAddress", setDefaultAddress);

module.exports = router;
