const mongoose = require("mongoose");

// Example User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["Admin", "Visitor", "Customer"],
    default: "Customer",
  },
  avatar: String,
  isGoogleUser: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: function () {
      return !this.isGoogleUser;
    },
  },
});
module.exports = mongoose.model("user", userSchema);
