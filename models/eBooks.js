const mongoose = require("mongoose");

const eBookSchema = {
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
  },
  imageFile: {
    type: String,
  },
  link: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
};

module.exports = mongoose.model("eBook", eBookSchema);
