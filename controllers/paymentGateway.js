const crypto = require("crypto");
require("dotenv").config();

const { Cashfree, CashfreePG, CFEnvironment } = require("cashfree-pg");

// Create config instance
const cfConfig = new Cashfree.CFConfig(
  CFEnvironment.SANDBOX,
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

// Initialize PG client
const pg = new CashfreePG(cfConfig);

// Generate a random order ID
function getOrderId() {
  const uniqueId = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256");
  hash.update(uniqueId);
  const orderId = hash.digest("hex");
  return orderId.substr(0, 12); // Return 12-char order ID
}

// Payment handler
exports.payment = async (req, res) => {
  try {
    const request = {
      order_amount: 1,
      order_currency: "INR",
      order_id: getOrderId(),
      customer_details: {
        customer_id: "node_sdk_test",
        customer_name: "John Doe",
        customer_email: "example@gmail.com",
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url:
          "https://test.cashfree.com/pgappsdemos/return.php?order_id=order_123",
      },
    };

    const response = await pg.orders.createOrder(request);
    res.json(response.data);
  } catch (err) {
    console.error("Order creation error:", err?.response?.data || err.message);
    res.status(500).send("Payment creation failed.");
  }
};

// Verification handler (empty for now)
exports.verify = async (req, res) => {
  try {
    res.send("Verify logic to be implemented");
  } catch (err) {
    res.status(500).send("Verification failed.");
  }
};
