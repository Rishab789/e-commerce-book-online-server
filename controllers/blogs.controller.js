const blogSchema = require("./../models/blog.model");

exports.getBlogs = async (req, res) => {
  try {
    const blogData = await blogSchema.find();
    res.json({
      response: blogData,
      success: true,
      message: "Blogs Successfully fetched",
    });
  } catch (err) {
    return res.status(501).json({
      success: false,
      message: "some Issue from the API",
    });
  }
};

exports.uploadBlogs = async (req, res) => {
  try {
    const formData = req.body;

    console.log("this is formData ", formData);

    const dataToSave = {
      title: formData.title,
      date: formData.date,
      cover: formData.cover,
      content: formData.content,
      desc: formData.desc,
      category: formData.category,
    };

    console.log("data", dataToSave);

    const newPost = new blogSchema(dataToSave);
    const savedPost = await newPost.save();

    res.json({
      success: true,
      message: "Blogs Uploaded Successfully!",
      post: savedPost,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err,
    });
  }
};
