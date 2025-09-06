const Address = require("../models/addressSchema");

// 📌 POST API: Save new address
exports.addAddress = async (req, res) => {
  try {
    const formData = req.body;

    // Here we assume req.user.id is set by your JWT authentication middleware
    // const userId = req.user.id;

    console.log(formData);

    const dataToSave = {
      user: formData.user,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: {
        street: formData.address.street,
        landmark: formData.address.landmark,
        city: formData.address.city,
        state: formData.address.state,
        pincode: formData.address.pincode,
      },
      isDefault: formData.isDefault || false,
    };

    const newAddress = new Address(dataToSave);
    const savedAddress = await newAddress.save();

    res.status(201).json({
      success: true,
      message: "Address saved successfully!",
      address: savedAddress,
    });
  } catch (err) {
    console.error("Error saving address:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while saving the address",
      error: err.message,
    });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    // assuming JWT middleware sets req.user.id
    const userId = req.params.id;

    console.log("this is the user id ", userId);

    const addresses = await Address.find({ user: userId });

    res.status(200).json({
      success: true,
      message: "Addresses fetched successfully!",
      addresses,
    });
  } catch (err) {
    console.error("Error fetching addresses:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching addresses",
      error: err.message,
    });
  }
};

// 📌 DELETE API: Remove an address by ID (for logged-in user)
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.params.id; // from JWT middleware
    const { id } = req.params; // address ID from URL

    // find and delete only if it belongs to this user
    const deletedAddress = await Address.findOneAndDelete(userId);

    if (!deletedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found or not authorized to delete",
      });
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully!",
      deletedAddress,
    });
  } catch (err) {
    console.error("Error deleting address:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the address",
      error: err.message,
    });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const userId = req.params.id; // from JWT middleware
    // const { id } = req.params; // address ID from URL
    const formData = req.body;

    console.log("this is the form data ... ", formData);

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: formData._id, user: formData.user }, // ensure user owns this address
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.address.street,
          landmark: formData.address.landmark,
          city: formData.address.city,
          state: formData.address.state,
          pincode: formData.address.pincode,
        },
        isDefault: formData.isDefault || false,
      },
      { new: true, runValidators: true } // return updated doc, run validations
    );

    if (!updatedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found or not authorized to update",
      });
    }

    res.status(200).json({
      success: true,
      message: "Address updated successfully!",
      updatedAddress,
    });
  } catch (err) {
    console.error("Error updating address:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the address",
      error: err.message,
    });
  }
};

// 📌 PATCH API: Set default address
exports.setDefaultAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.body;

    // First, unset the current default
    await Address.updateMany(
      { user: userId, isDefault: true },
      { $set: { isDefault: false } }
    );

    // Then set the new one
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, user: userId },
      { $set: { isDefault: true } },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found or not authorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Default address updated successfully!",
      updatedAddress,
    });
  } catch (err) {
    console.error("Error setting default address:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while setting default address",
      error: err.message,
    });
  }
};
