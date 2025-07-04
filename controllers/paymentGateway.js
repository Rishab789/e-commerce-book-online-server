const crypto = require("crypto");
const { Cashfree } = require("cashfree-pg");
const { request } = require("http");

Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

function getOrderId() {
  const uniqueId = crypto.randomBytes(16).toString("hex");

  const hash = crypto.createHash("sha256");
  hash.update(uniqueId);

  const orderId = hash.digest("hex");

  return orderId.substr(0, 12);
}

exports.payment = async (req, res) => {
  try {
    let request = {
      order_amount: "1",
      order_currency: "INR",
      order_id: await getOrderId(),
      customer_details: {
        customer_id: "node_sdk_test",
        customer_name: "",
        customer_email: "example@gmail.com",
        customer_phone: "9999999999",
      },
    };
    Cashfree.PGCreateOrder("05-07-2025", request)
      .then((response) => {
        console.log(response.data);
        res.json(response.data);
      })
      .catch((err) => {
        console.log(err.response.data.message);
      });
  } catch (err) {}
};

exports.verify = async (req, res) => {
  try {
  } catch (err) {}
};
