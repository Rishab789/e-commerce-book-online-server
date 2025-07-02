const bcrypt = require("bcrypt");
const User = require("./../models/User");
const jwt = require("jsonwebtoken");
const { options } = require("../routes/user");

require("dotenv").config();

//Sign Up Route Handler

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    //secure password
    let hashedPassword;

    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Error in hashing password",
      });
    }

    // create User in DB
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return res.status(200).json({
      success: true,
      message: "User Created Successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered, please try again later",
    });
  }
};

// Login

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registered",
      });
    }

    const payload = {
      email: user.email,
      id: user._id,
      role: user.role,
    };

    if (await bcrypt.compare(password, user.password)) {
      let token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });

      console.log("JWT_SECRET:", process.env.JWT_SECRET);

      user = user.toObject();
      user.token = token;
      user.password = undefined;

      const options = {
        expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        // expires: new Date(Date.now() + 10 * 1000), // 10 seconds from now

        httpOnly: true,
      };

      console.log("this is option ", options);
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "User Logged In Successfully",
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "Password Incorrect",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Login Failure",
    });
  }
};

exports.passwordReset = async (req, res, next) => {
  // const { id } = req.params;

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User not exists!",
        status: false,
      });
    }
    const encryptPassword = await bcrypt.hash(password, 10);
    user.password = encryptPassword;
    await user.save();
    res.status(200).json({ message: "Password has been reset" });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Something went wrong from reset password controller" });
  }
};
