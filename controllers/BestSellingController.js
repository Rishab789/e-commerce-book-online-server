const BestSellingSchema = require("../models/BestSellingModel");
const cloudinary = require("cloudinary").v2; // Make sure Cloudinary is configured properly

exports.uploadBestSelling = async (req, res) => {
  try {
    const files = req.files; // All uploaded files
    const formData = req.body; // Other form fields

    // Process and upload authorImage to Cloudinary
    const authorImageFile = files.find(
      (file) => file.fieldname === "authorImage"
    );
    const authorImageUrl = authorImageFile
      ? await uploadToCloudinary(authorImageFile.path)
      : null;

    // Process and upload featureImage to Cloudinary
    const featureImageFile = files.find(
      (file) => file.fieldname === "featureImage"
    );
    const featureImageUrl = featureImageFile
      ? await uploadToCloudinary(featureImageFile.path)
      : null;

    const additionalBooks = [];
    if (Array.isArray(formData.books)) {
      for (const [index, book] of formData.books.entries()) {
        const bookData = { ...book };

        const imageFile = files.find(
          (file) => file.fieldname === `books[${index}][image]`
        );
        if (imageFile) {
          bookData.image = await uploadToCloudinary(imageFile.path); // Await works properly here
        }

        additionalBooks.push(bookData);
      }
    }

    console.log("formData:", formData);

    // Create final data object to save in DB
    const dataToSave = {
      author: {
        name: formData.authorName,
        bio: formData.authorBio,
        image: authorImageUrl,
      },
      featuredBook: {
        title: formData.featureTitle,
        description: formData.featureDescription,
        price: formData.featurePrice,
        image: featureImageUrl,
      },
      additionalBooks,
    };

    // console.log("this is dataToSave", dataToSave);

    // Save data to the database
    const newPost = new BestSellingSchema(dataToSave);
    const savedPost = await newPost.save();

    res.json({
      success: true,
      message: "Best Selling Books Uploaded Successfully!",
      post: savedPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while uploading data",
    });
  }
};

// Helper function to upload file to Cloudinary
async function uploadToCloudinary(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "bookstore", // Optional: specify folder name in Cloudinary
    });
    console.log("Cloudinary upload result:", result); // Add this line to check the upload result

    return result.secure_url; // Return the URL of the uploaded image
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error("Image upload to Cloudinary failed");
  }
}
