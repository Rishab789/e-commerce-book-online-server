const eBookSchema = require("./../models/eBooks");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const os = require("os");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

exports.uploadEbook = async (req, res) => {
  let tempImagePath = null;

  try {
    const files = req.files;
    const formData = req.body;

    console.log(
      "Received files:",
      files ? files.map((f) => f.fieldname) : "No files"
    );
    console.log("Form data:", formData);

    // Validate required fields
    if (!formData.title || !formData.author || !formData.price) {
      return res.status(400).json({
        success: false,
        message: "Title, author, and price are required fields!",
      });
    }

    // Find image and eBook files
    const imageFile = files.find((file) => file.fieldname === "imageFile");
    const ebookFile = files.find((file) => file.fieldname === "ebookFile");

    if (!ebookFile) {
      return res.status(400).json({
        success: false,
        message: "eBook file is required!",
      });
    }

    // Upload image to Cloudinary (optional - for cover image)
    let imageFileUrl = formData.imageUrl || null;
    if (imageFile) {
      // Save buffer to temporary file for Cloudinary upload
      tempImagePath = path.join(
        os.tmpdir(),
        `cover-${Date.now()}-${imageFile.originalname}`
      );
      fs.writeFileSync(tempImagePath, imageFile.buffer);

      imageFileUrl = await uploadToCloudinary(tempImagePath);
      console.log("Cloudinary upload successful:", imageFileUrl);
    }

    // Upload eBook to AWS S3
    const { s3Key, fileSize, format } = await uploadEbookToS3(
      ebookFile,
      formData.title
    );

    // Prepare data for saving
    const dataToSave = {
      title: formData.title,
      author: formData.author,
      price: formData.price,
      imageUrl: formData.imageUrl || null,
      imageFile: imageFileUrl,
      description: formData.description,
      category: formData.category,
      type: "ebook",
      s3Key: s3Key,
      fileSize: fileSize,
      format: format,
    };

    // Save to database
    const newPost = new eBookSchema(dataToSave);
    const savedPost = await newPost.save();

    // Clean up temporary file if it exists
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }

    res.json({
      post: savedPost,
      success: true,
      message: "eBook Uploaded Successfully!",
    });
  } catch (err) {
    // Clean up temporary file if it exists (even on error)
    if (tempImagePath && fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }

    console.error("Error uploading eBook:", err);
    return res.status(500).json({
      success: false,
      message: "Error while saving eBook!",
      error: err.message,
    });
  }
};

// Helper function to upload eBook to AWS S3
async function uploadEbookToS3(file, title) {
  try {
    // Check if file buffer exists
    if (!file.buffer) {
      throw new Error("File buffer is undefined. Check multer configuration.");
    }

    const fileExtension = file.originalname.split(".").pop();
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const s3Key = `ebooks/${sanitizedTitle}-${uuidv4()}.${fileExtension}`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer, // This was undefined
      ContentType: file.mimetype,
      ACL: "private",
    };

    await s3.upload(uploadParams).promise();

    return {
      s3Key: s3Key,
      fileSize: formatFileSize(file.size),
      format: fileExtension.toUpperCase(),
    };
  } catch (error) {
    console.error("S3 upload failed:", error);
    throw new Error("eBook upload to S3 failed");
  }
}
// Helper function to upload to Cloudinary
async function uploadToCloudinary(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "bookstore",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error("Image upload to Cloudinary failed");
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await eBookSchema.find().select("-s3Key");
    res.json({
      success: true,
      message: "Ebooks fetched successfully",
      posts,
    });
  } catch (err) {
    console.error("Error fetching eBooks:", err);
    return res.status(500).json({
      success: false,
      error: "Error while getting posts!",
      message: err.message,
    });
  }
};

exports.uploadReviewsEbookById = async (req, res) => {
  try {
    const { username, review, stars, id } = req.body;

    // Validate input
    if (!username || !review || !stars || !id) {
      return res.status(400).json({
        success: false,
        message: "Username, review, stars, and book ID are required!",
      });
    }

    // Validate stars is a number between 1-5
    const starsNum = parseFloat(stars);
    if (isNaN(starsNum) || starsNum < 1 || starsNum > 5) {
      return res.status(400).json({
        success: false,
        message: "Stars must be a number between 1 and 5!",
      });
    }

    const ebook = await eBookSchema.findById(id);
    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: "eBook not found!",
      });
    }

    // Add review
    ebook.reviewsContent.push({
      username: username,
      review: review,
      stars: starsNum.toString(),
    });

    const savedPost = await ebook.save();

    res.status(200).json({
      post: savedPost,
      success: true,
      message: "Review added successfully!",
    });
  } catch (err) {
    console.error("Error adding review:", err);
    return res.status(500).json({
      success: false,
      message: "Error coming from Server Side",
      error: err.message,
    });
  }
};

exports.getDownloadUrl = async (req, res) => {
  try {
    const { ebookId } = req.params;

    // Verify user has purchased this ebook (you should implement proper authentication)
    // For now, we'll just check if the eBook exists
    const ebook = await eBookSchema.findById(ebookId);
    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: "eBook not found!",
      });
    }

    if (!ebook.s3Key) {
      return res.status(404).json({
        success: false,
        message: "eBook file not available!",
      });
    }

    // Generate signed URL for download (expires in 1 hour)
    const signedUrl = await s3.getSignedUrlPromise("getObject", {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: ebook.s3Key,
      Expires: 3600,
      ResponseContentDisposition: `attachment; filename="${
        ebook.title
      }.${ebook.format.toLowerCase()}"`,
    });

    res.json({
      success: true,
      downloadUrl: signedUrl,
      expiresIn: "1 hour",
    });
  } catch (err) {
    console.error("Error generating download URL:", err);
    return res.status(500).json({
      success: false,
      message: "Error generating download link",
      error: err.message,
    });
  }
};

// Test endpoint to check Cloudinary configuration
exports.testCloudinary = async (req, res) => {
  try {
    // Create a simple test image
    const testImagePath = path.join(os.tmpdir(), `test-${Date.now()}.txt`);
    fs.writeFileSync(testImagePath, "This is a test file for Cloudinary");

    const result = await cloudinary.uploader.upload(testImagePath, {
      folder: "test",
    });

    fs.unlinkSync(testImagePath);

    res.json({
      success: true,
      message: "Cloudinary is configured correctly",
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Cloudinary test failed:", error);
    res.status(500).json({
      success: false,
      message: "Cloudinary configuration error",
      error: error.message,
    });
  }
};
