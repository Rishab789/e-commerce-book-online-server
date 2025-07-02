const mongoose = require("mongoose");

const placedOrderSchema = new mongoose.Schema({
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: String,
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  customer: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      landmark: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
  },
  orderSummary: {
    totalPrice: { type: Number, required: true },
    gstPrice: { type: Number },
    shippingCost: { type: Number, required: true },
    coupon: {
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending",
  },
  deliveryStatus: {
    type: String,
    enum: [
      "Pending",
      "Shipped",
      "In Transit",
      "Delivered",
      "Cancelled",
      "Returned",
    ],
    default: "Pending",
  },
  trackingNumber: {
    type: String,
    default: null,
  },
  placedAt: {
    type: Date,
    default: Date.now,
  },
});

const PlacedOrder = mongoose.model("PlacedOrder", placedOrderSchema);

module.exports = PlacedOrder;
