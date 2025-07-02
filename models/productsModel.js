const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  imageList: {
    type: Array,
  },
  image2: {
    type: String,
  },
  imageFile: {
    type: String,
  },
  imageFile2: {
    type: String,
  },
  details: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
  featured: {
    type: String,
  },

  reviewsContent: [
    {
      username: {
        type: String,
      },
      review: {
        type: String,
      },
      stars: {
        type: String,
      },
    },
  ],
});

// Virtual field for reviews
productSchema.virtual("reviews").get(function () {
  return this.reviewsContent.length;
});

// Virtual field for `stars` (average rating)
productSchema.virtual("stars").get(function () {
  if (!this.reviewsContent || this.reviewsContent.length === 0) {
    return 0; // Default to 0 if no reviews
  }
  const totalStars = this.reviewsContent.reduce((acc, review) => {
    const starValue = parseFloat(review.stars); // Use parseFloat for decimals if applicable
    return !isNaN(starValue) ? acc + starValue : acc;
  }, 0);
  return (totalStars / this.reviewsContent.length).toFixed(1); // Rounded to 1 decimal
});

// Ensure virtuals are included in JSON output
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("products", productSchema);
