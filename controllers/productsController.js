const productSchema = require("./../models/productsModel");
const cloudinary = require("cloudinary").v2; // Make sure Cloudinary is configured properly

exports.uploadProducts = async (req, res) => {
  try {
    const files = req.files;
    const formData = req.body;

    const imageFile = files.find((file) => file.fieldname === "imageFile");
    const imageFileUrl = imageFile
      ? await uploadToCloudinary(imageFile.path)
      : null;
    const imageFile2 = files.find((file) => file.fieldname === "imageFile2");
    const imageFile2Url = imageFile2
      ? await uploadToCloudinary(imageFile2.path)
      : null;

    const dataToSave = {
      title: formData.title,
      authorName: formData.authorName,
      price: formData.price,
      image: formData.image,
      image2: formData.image2,
      imageFile: imageFileUrl,
      imageFile2: imageFile2Url,
      details: formData.details,
      genre: formData.genre,
      featured: formData.featured,
    };

    console.log("data", dataToSave);

    const newPost = new productSchema(dataToSave);
    const savedPost = await newPost.save();

    res.json({
      success: true,
      message: "Best Selling Books Uploaded Successfully!",
      post: savedPost,
    });
  } catch (err) {
    console.log(err);
    console.error(err);
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

exports.getProducts = async (req, res) => {
  try {
    const products = await productSchema.find();
    res.json({
      response: products,
      success: true,
      message: "Products fetched",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "some Issue from the API",
    });
  }
};

exports.uploadReviewsById = async (req, res) => {
  try {
    const { username, review, stars, id } = req.body;
    const products = await productSchema.findByIdAndUpdate(id);
    console.log("this is the products", products);
    const obj = new Object();
    obj.username = username;
    obj.review = review;
    obj.stars = stars;
    console.log("this is the Object", obj);

    products.reviewsContent.push(obj);

    const newPost = new productSchema(products);
    const savedPost = await newPost.save();

    res.status(200).json({
      post: savedPost,
      success: true,
      message: "Reviews Uploaded Successfully!",
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Error coming from Server Side",
      error: err,
    });
  }
};
