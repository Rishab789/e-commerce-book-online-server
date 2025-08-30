const eBookSchema = require("./../models/eBooks");
const cloudinary = require("cloudinary").v2; // Make sure Cloudinary is configured properly

exports.uploadEbook = async (req, res) => {
  try {
    const files = req.files;
    const formData = req.body;

    console.log("this is files", files);
    console.log("this is formDate", formData);

    // const { title, author, imageUrl, description, link, category } = req.body;

    const imageFile = files.find((file) => file.fieldname === "imageFile");
    const imageFileUrl = imageFile
      ? await uploadToCloudinary(imageFile.path)
      : null;

    // const post = new eBook({
    //   title,
    //   author,
    //   price,
    //   imageUrl,
    //   description,
    //   link,
    //   category,
    // });

    const dataToSave = {
      title: formData.title,
      author: formData.author,
      price: formData.price,
      imageUrl: formData.imageUrl,
      imageFile: imageFileUrl,
      description: formData.description,
      link: formData.link,
      category: formData.category,
      type: "ebook",
    };

    // const savedPost = await post.save();

    const newPost = new eBookSchema(dataToSave);
    const savedPost = await newPost.save();

    res.json({
      post: savedPost,
      success: true,
      message: "eBook Uploaded Successfully!",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Error while Saving Post!",
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

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await eBookSchema.find();
    res.json({
      success: true,
      message: "Ebooks fetched successfullly",
      posts,
    });
  } catch (err) {
    return res.status(400).json({
      error: "Error While getting posts!",
    });
  }
};

// exports.uploadReviewsEbbokById = async (req, res) => {
//   try {
//     const { username, review, stars, id } = req.body;
//     const ebooks = await eBookSchema.findByIdAndUpdate(id);
//     console.log("this is the e-books products", ebooks);
//     const obj = new Object();
//     obj.username = username;
//     obj.review = review;
//     obj.stars = stars;
//     console.log("this is the Object", obj);

//     ebooks.reviewsContent.push(obj);

//     const newPost = new eBookSchema(ebooks);
//     const savedPost = await newPost.save();

//     res.status(200).json({
//       post: savedPost,
//       success: true,
//       message: "Reviews Uploaded Successfully!",
//     });
//   } catch (err) {
//     return res.status(501).json({
//       success: false,
//       message: "Error coming from Server Side",
//       error: err,
//     });
//   }
// };
