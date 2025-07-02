const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: String,
  image: String, // Path to the image
});

const BestSellingSchema = new mongoose.Schema({
  author: {
    name: String,
    bio: String,
    image: String, // Path to the image
  },
  featuredBook: {
    title: String,
    description: String,
    price: String,
    image: String, // Path to the image
  },
  additionalBooks: [BookSchema],
});

module.exports = mongoose.model("BestSelling", BestSellingSchema);
