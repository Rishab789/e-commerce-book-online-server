const Cart = require("./../models/cartItemSchema ");

// ✅ Add product to cart
exports.addToCart = async (req, res) => {
  try {
    const { userId, productId, title, image, price, quantity = 1 } = req.body;

    // Validate required fields
    if (!userId || !productId || !title || !price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, productId, title, price",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        userId,
        items: [{ productId, title, image, price, quantity }],
      });
    } else {
      // Check if product already exists in cart
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId.toString()
      );

      if (existingItem) {
        existingItem.quantity += quantity; // update quantity
      } else {
        cart.items.push({ productId, title, image, price, quantity });
      }
    }

    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get cart by userId
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("this is get cart user id ", userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { userId, items: [] },
      });
    }

    res.status(200).json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Remove product from cart completely
exports.removeFromCart = async (req, res) => {
  console.log("this is req body ", req.body);
  try {
    const { userId, productId } = req.body; // Change parameter name

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Check if item exists by _id
    const itemExists = cart.items.some(
      (item) => item.productId.toString() === productId.toString()
    );

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );

    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Increase product quantity
exports.increaseQuantity = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Validate required fields
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Product ID are required",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId.toString()
    );

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    existingItem.quantity += 1;

    await cart.save();
    res.status(200).json({
      success: true,
      cart,
      message: "Quantity increased successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Decrease product quantity
exports.decreaseQuantity = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Validate required fields
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Product ID are required",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId.toString()
    );

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    if (existingItem.quantity <= 1) {
      // Remove item if quantity becomes 0 or less
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId.toString()
      );

      await cart.save();
      return res.status(200).json({
        success: true,
        cart,
        message: "Product removed from cart (quantity was 1)",
      });
    } else {
      existingItem.quantity -= 1;

      await cart.save();
      return res.status(200).json({
        success: true,
        cart,
        message: "Quantity decreased successfully",
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Update product quantity directly
exports.updateQuantity = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    // Validate required fields
    if (!userId || !productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "User ID, Product ID, and quantity are required",
      });
    }

    // Validate quantity
    if (quantity < 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a non-negative integer",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId.toString()
    );

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId.toString()
      );

      await cart.save();
      return res.status(200).json({
        success: true,
        cart,
        message: "Product removed from cart",
      });
    } else {
      existingItem.quantity = quantity;

      await cart.save();
      return res.status(200).json({
        success: true,
        cart,
        message: "Quantity updated successfully",
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      cart,
      message: "Cart cleared successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get cart total
exports.getCartTotal = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        total: 0,
        itemCount: 0,
      });
    }

    const total = cart.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const itemCount = cart.items.reduce((count, item) => {
      return count + item.quantity;
    }, 0);

    res.status(200).json({
      success: true,
      total: parseFloat(total.toFixed(2)),
      itemCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
