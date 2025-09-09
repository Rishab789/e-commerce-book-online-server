const Shipment = require("../models/shipmentSchema ");

// Store shipment in database
exports.storeShipment = async (
  userId,
  cashfreeOrderId,
  shiprocketOrderId,
  shiprocketShipmentId,
  orderData = {}
) => {
  try {
    const shipment = new Shipment({
      userId,
      cashfreeOrderId,
      shiprocketOrderId,
      shiprocketShipmentId,
      orderData,
    });

    await shipment.save();
    console.log("✅ Shipment stored in database:", shiprocketOrderId);
    return shipment;
  } catch (error) {
    console.error("❌ Error storing shipment:", error);
    throw error;
  }
};

// Get shipments by user ID
exports.getShipmentsByUserId = async (userId) => {
  try {
    const shipments = await Shipment.find({ userId }).sort({ createdAt: -1 }); // Latest first
    return shipments;
  } catch (error) {
    console.error("❌ Error fetching shipments:", error);
    throw error;
  }
};

// Get shipment by Shiprocket order ID
exports.getShipmentByOrderId = async (shiprocketOrderId) => {
  try {
    const shipment = await Shipment.findOne({ shiprocketOrderId });
    return shipment;
  } catch (error) {
    console.error("❌ Error fetching shipment:", error);
    throw error;
  }
};
