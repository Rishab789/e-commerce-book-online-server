require("dotenv").config();
const crypto = require("crypto");
const { Cashfree, CFEnvironment } = require("cashfree-pg");

const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION,
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

function getOrderId() {
  const uniqueId = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256");
  hash.update(uniqueId);
  return hash.digest("hex").substr(0, 12);
}

exports.payment = async (req, res) => {
  console.log("this is the payment integration ", req.body);
  try {
    const request = {
      order_amount: 1,
      order_currency: "INR",
      order_id: await getOrderId(),
      customer_details: {
        customer_id: "node_sdk_test",
        customer_name: "Test User",
        customer_email: "example@gmail.com",
        customer_phone: "9999999999",
      },
      order_meta: {
        // return_url: `http://localhost:1234/payment-success?order_id=${await getOrderId()}`,
        return_url: `https://novelez-prod.netlify.app/payment-success?order_id=${await getOrderId()}`,
      },
    };

    const response = await cashfree.PGCreateOrder(request);

    console.log("✅ Order created:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("❌ Payment Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Payment failed" });
  }
};

exports.verify = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log("Verifying order with ID:", orderId);

    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    const response = await cashfree.PGOrderFetchPayments(date, orderId);
    if (response.data.order_status === "PAID") {
      res.json({
        success: true,
        message: "Payment successful",
        data: response.data,
      });
    } else {
      res.json({
        success: false,
        message: "Payment not completed",
        data: response.data,
      });
    }

    console.log("✅ Payment verification response:", response.data);
    res.json(response.data);
  } catch (err) {
    console.error("❌ Verification error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
