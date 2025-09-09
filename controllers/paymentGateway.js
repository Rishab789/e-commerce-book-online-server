require("dotenv").config();
const crypto = require("crypto");
const { Cashfree, CFEnvironment } = require("cashfree-pg");
const axios = require("axios"); // Added axios import
const {
  storeShipment,
  getShipmentsByUserId,
  getShipmentByOrderId,
  updateShipmentStatus,
} = require("../services/shipmentServices");

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);

const SHIPROCKET_CONFIG = {
  BASE_URL: "https://apiv2.shiprocket.in/v1/external",
  EMAIL: process.env.EMAIL,
  PASSWORD: process.env.SHIPROCKET_PASSWORD,
};

// Store order data temporarily (in production, use a database)
const orderStore = new Map();

function getOrderId() {
  const uniqueId = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256");
  hash.update(uniqueId);
  return hash.digest("hex").substr(0, 12);
}

exports.orderPlace = async (req, res) => {
  try {
    const {
      products,
      customer,
      orderSummary,
      paymentStatus,
      deliveryStatus,
      placedAt,
    } = req.body;

    const orderId = await getOrderId();

    // Store order data for later use in verification
    orderStore.set(orderId, {
      products,
      customer,
      orderSummary,
      placedAt: new Date(),
    });

    const orderData = {
      order_amount: orderSummary.totalPrice + orderSummary.shippingCost,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: customer.userId,
        customer_name: customer.firstName + " " + customer.lastName,
        customer_email: customer.email,
        customer_phone: customer.phone,
      },
      order_meta: {
        return_url: `http://localhost:1234/payment-success?order_id=${orderId}`,
        // return_url: `https://novelez-prod.netlify.app/payment-success?order_id=${await getOrderId()}`,
      },
      cart_details: {
        cart_items: [
          {
            product_id: products.productId,
            product_name: products.name,
            quantity: products.quantity,
            price: products.price,
          },
        ],
      },
    };

    const cashfreeResponse = await cashfree.PGCreateOrder(orderData);

    if (cashfreeResponse.data.payment_session_id) {
      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        orderId: cashfreeResponse.data.cf_order_id,
        paymentSessionId: cashfreeResponse.data.payment_session_id,
      });
    } else {
      throw new Error("Failed to create payment session");
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.verify = async (req, res) => {
  try {
    const { order_id } = req.body;
    console.log("Verifying order with ID:", order_id);

    // Get stored order data
    const orderData = orderStore.get(order_id);
    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: "Order data not found",
      });
    }

    const response = await cashfree.PGFetchOrder(order_id);

    if (response.data.order_status === "PAID") {
      // Create Shiprocket order only if payment is successful

      try {
        const shiprocketOrder = await createShiprocketOrder(
          { order_id: order_id },
          orderData.customer,
          orderData.products
        );

        // STORE IN MONGODB DATABASE
        await storeShipment(
          orderData.customer.userId, // user_id
          order_id, // cashfree_order_id
          shiprocketOrder.order_id, // shiprocket_order_id (958676802)
          shiprocketOrder.shipment_id, // shiprocket_shipment_id (955102724)
          orderData // complete order data for backup
        );

        console.log("✅ Payment verification response:", response.data);

        // Clean up stored order data
        orderStore.delete(order_id);

        res.json({
          success: true,
          message: "Payment successful and order created in Shiprocket",
          payment_data: response.data,
          shiprocket_data: shiprocketOrder,
          order_id: shiprocketOrder.order_id,
          shipment_id: shiprocketOrder.shipment_id,
        });
      } catch (shiprocketError) {
        console.error("❌ Shiprocket order creation failed:", shiprocketError);
        // Payment was successful but Shiprocket failed
        res.json({
          success: true,
          message: "Payment successful but Shiprocket order creation failed",
          payment_data: response.data,
          shiprocket_error: shiprocketError.message,
        });
      }
    } else {
      res.json({
        success: false,
        message: "Payment not completed",
        data: response.data,
      });
    }
  } catch (err) {
    console.error("❌ Verification error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

////////////////////////////////SHIPROCKET///////////////////////
// Store auth token in memory (in production, use Redis or database)
let shiprocketAuthToken = null;
let tokenExpiry = null;

async function getShiprocketAuthToken() {
  try {
    // Check if token exists and is not expired
    if (shiprocketAuthToken && tokenExpiry && new Date() < tokenExpiry) {
      return shiprocketAuthToken;
    }

    const response = await axios.post(
      `${SHIPROCKET_CONFIG.BASE_URL}/auth/login`,
      {
        email: SHIPROCKET_CONFIG.EMAIL,
        password: SHIPROCKET_CONFIG.PASSWORD,
      }
    );

    if (response.data && response.data.token) {
      shiprocketAuthToken = response.data.token;
      // Set token expiry (typically 24 hours, but set to 23 hours to be safe)
      tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
      console.log("✅ Shiprocket auth token obtained successfully");
      return shiprocketAuthToken;
    } else {
      throw new Error("Failed to get auth token from Shiprocket");
    }
  } catch (error) {
    console.error(
      "❌ Shiprocket auth error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to authenticate with Shiprocket");
  }
}

// Create Order in ship rocket
async function createShiprocketOrder(orderData, customer, products) {
  console.log("this is the data 1  --> ", orderData);
  console.log("this is the data 2  --> ", customer);
  console.log("this is the data 3  --> ", products);
  try {
    const authToken = await getShiprocketAuthToken();
    const pickupLocationsResponse = await getShiprocketPickupLocations();
    let pickupLocation = "Primary";

    // Correctly access the shipping_address array
    if (
      pickupLocationsResponse &&
      pickupLocationsResponse.shipping_address &&
      pickupLocationsResponse.shipping_address.length > 0
    ) {
      pickupLocation =
        pickupLocationsResponse.shipping_address[0].pickup_location;
      console.log(`Using pickup location: ${pickupLocation}`);
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const shiprocketOrderData = JSON.stringify({
      order_id: orderData.order_id,
      order_date: formattedDate,
      pickup_location: pickupLocation,
      comment: "",
      billing_customer_name: customer.firstName,
      billing_last_name: customer.lastName,
      billing_address: customer.address.street,
      billing_address_2: customer.address.landmark,
      billing_city: customer.address.city,
      billing_pincode: customer.address.pincode,
      billing_state: customer.address.state,
      billing_country: "India",
      billing_email: customer.email,
      billing_phone: customer.phone,
      shipping_is_billing: true,
      shipping_customer_name: "",
      shipping_last_name: "",
      shipping_address: "",
      shipping_address_2: "",
      shipping_city: "",
      shipping_pincode: "",
      shipping_country: "",
      shipping_state: "",
      shipping_email: "",
      shipping_phone: "",
      order_items: products.map((product) => ({
        name: product.name,
        sku: product.productId, // Using the product ID as SKU
        units: product.quantity,
        selling_price: product.price,
        discount: "",
        tax: "",
        hsn: 0, // You might want to make this dynamic too if you have HSN codes
      })),
      payment_method: "Prepaid",
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: 9000,
      length: 10,
      breadth: 15,
      height: 20,
      weight: 2.5,
    });

    const response = await axios.post(
      `${SHIPROCKET_CONFIG.BASE_URL}/orders/create/adhoc`,
      shiprocketOrderData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Shiprocket order created:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Shiprocket order creation error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getShiprocketPickupLocations() {
  try {
    const authToken = await getShiprocketAuthToken();
    const response = await axios.get(
      `${SHIPROCKET_CONFIG.BASE_URL}/settings/company/pickup`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Available pickup locations:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error(
      "Error fetching pickup locations:",
      error.response?.data || error.message
    );
    return [];
  }
}

exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.query;

    console.log("Fetching orders for user ID:", userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required to fetch orders",
      });
    }

    // 1. Get user's shipment records from MongoDB
    const userShipments = await getShipmentsByUserId(userId);

    if (userShipments.length === 0) {
      return res.json({
        success: true,
        data: {
          orders: [],
          total_orders: 0,
          user_info: { user_id: userId },
        },
      });
    }

    const authToken = await getShiprocketAuthToken();

    // 2. Get order details from Shiprocket for each shipment
    const ordersWithDetails = await Promise.all(
      userShipments.map(async (shipment) => {
        try {
          const response = await axios.get(
            `${SHIPROCKET_CONFIG.BASE_URL}/orders/show/${shipment.shiprocketOrderId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          return {
            ...response.data.data,
            // Add MongoDB document ID for reference
            db_shipment_id: shipment._id,
            // Add timestamps from our database
            order_created_at: shipment.createdAt,
            order_updated_at: shipment.updatedAt,
          };
        } catch (error) {
          console.error(
            `Error fetching order ${shipment.shiprocketOrderId}:`,
            error.message
          );
          // Return basic info from our database if Shiprocket API fails
          return {
            order_id: shipment.shiprocketOrderId,
            shipment_id: shipment.shiprocketShipmentId,
            status: "UNKNOWN",
            error: "Failed to fetch details from Shiprocket",
            order_data: shipment.orderData, // Fallback to our stored data
          };
        }
      })
    );

    console.log(
      `✅ Found ${ordersWithDetails.length} orders for user: ${userId}`
    );

    res.json({
      success: true,
      data: {
        orders: ordersWithDetails,
        total_orders: ordersWithDetails.length,
        user_info: {
          user_id: userId,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching user orders:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user orders",
      error: error.message,
    });
  }
};

// Cancel Order API
exports.cancelOrder = async (req, res) => {
  try {
    const { order_id } = req.body;

    console.log("Canceling order with ID:", order_id);

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required to cancel order",
      });
    }

    // 1. Get the shipment record from MongoDB
    const shipment = await getShipmentByOrderId(order_id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Order not found in database",
      });
    }

    const authToken = await getShiprocketAuthToken();

    // 2. Call Shiprocket cancel order API
    const cancelData = {
      ids: [shipment.shiprocketOrderId], // Array of order IDs to cancel
    };

    const response = await axios.post(
      `${SHIPROCKET_CONFIG.BASE_URL}/orders/cancel`,
      cancelData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Shiprocket cancel order response:", response.data);

    if (response.data && response.data.status === 200) {
      // 3. Update the order status in MongoDB
      await updateShipmentStatus(shipment._id, "CANCELLED");

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: response.data,
        order_id: shipment.shiprocketOrderId,
      });
    } else {
      throw new Error("Failed to cancel order in Shiprocket");
    }
  } catch (error) {
    console.error(
      "❌ Cancel order error:",
      error.response?.data || error.message
    );

    // Handle specific error cases
    let errorMessage = error.message;
    let statusCode = 500;

    if (error.response && error.response.data) {
      errorMessage = error.response.data.message || errorMessage;
      statusCode = error.response.status || statusCode;
    }

    res.status(statusCode).json({
      success: false,
      message: "Failed to cancel order",
      error: errorMessage,
    });
  }
};

// Clean up expired orders periodically (optional)
setInterval(() => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  for (const [orderId, orderData] of orderStore.entries()) {
    if (orderData.placedAt < oneHourAgo) {
      orderStore.delete(orderId);
      console.log(`Cleaned up expired order: ${orderId}`);
    }
  }
}, 30 * 60 * 1000); // Run every 30 minutes
