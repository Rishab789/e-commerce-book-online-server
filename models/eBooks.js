const mongoose = require("mongoose");

const eBookSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: false,
  },
  s3Key: {
    type: String,
    required: function () {
      return this.type === "ebook"; // Required only for eBooks
    },
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
eBookSchema.virtual("reviews").get(function () {
  return this.reviewsContent.length;
});

// Virtual field for `stars` (average rating)
eBookSchema.virtual("stars").get(function () {
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
eBookSchema.set("toJSON", { virtuals: true });
eBookSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("eBook", eBookSchema);
