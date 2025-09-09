const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  cashfreeOrderId: {
    type: String,
    required: true,
  },
  shiprocketOrderId: {
    type: Number,
    required: true,
  },
  shiprocketShipmentId: {
    type: Number,
    required: true,
  },
  orderData: {
    type: Object,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
shipmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Shipment", shipmentSchema);
