const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  getCartTotal,
} = require("../controllers/cartController");

// Add to cart
router.post("/cart", addToCart);

// Get user cart
router.get("/cart/:userId", getCart);

// Remove from cart
router.delete("/removeFromCart", removeFromCart);
router.patch("/increaseQty", increaseQuantity);
router.patch("/decreaseQty", decreaseQuantity);
router.get("./getCartTotal/:id", getCartTotal);

module.exports = router;
