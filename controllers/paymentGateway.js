require("dotenv").config();
const crypto = require("crypto");
const { Cashfree, CFEnvironment } = require("cashfree-pg"); // Import the whole module

// const cfConfig = {
//   env: Cashfree.CFEnvironment.SANDBOX, // or Cashfree.CFEnvironment.PRODUCTION
//   clientId: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
// };

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

// const pg = Cashfree.CFPaymentGateway(cfConfig); // Use as a function, not a constructor

function getOrderId() {
  const uniqueId = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256");
  hash.update(uniqueId);
  return hash.digest("hex").substring(0, 12);
}

exports.payment = async (req, res) => {
  try {
    const request = {
      order_amount: 1,
      order_currency: "INR",
      order_id: getOrderId(),
      customer_details: {
        customer_id: "node_sdk_test",
        customer_name: "Test User",
        customer_email: "example@gmail.com",
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url:
          "https://test.cashfree.com/pgappsdemos/return.php?order_id=order_123",
      },
    };

    // ✅ Wait for the response properly
    const response = await cashfree.PGCreateOrder(request);

    console.log("✅ Order created:", response.data);
    res.json(response.data); // ✅ Now it's defined
  } catch (error) {
    console.error("❌ Payment Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Payment failed" });
  }
};

// Verification handler (empty for now)
exports.verify = async (req, res) => {
  try {
    let { orderId } = req.body;

    Cashfree.PGOrderFetchPayments("05-07-2025", orderId).then((response) => {
      res.json(response.data);
    });
  } catch (err) {
    console.log(err);
  }
};
