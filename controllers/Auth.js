const bcrypt = require("bcrypt");
const User = require("./../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
// const { options } = require("../routes/user");
const { OAuth2Client } = require("google-auth-library");

require("dotenv").config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // // create User in DB
    // const user = await User.create({
    //   name,
    //   email,
    //   password: hashedPassword,
    //   role,
    //   isVerified: false,
    // });

    // Generate verification token (valid for 1 hour)
    const token = jwt.sign(
      {
        name,
        email,
        password: hashedPassword, // Store hashed password in token
        role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Verification URL (frontend route)
    const verifyUrl = `${process.env.ORIGIN}/verify-email/${token}`;

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"NovelEz" <${process.env.MY_EMAIL}>`,
      to: email,
      subject: "Verify your email",
      html: `<p>Hello ${name},</p>
             <p>Please verify your email by clicking the link below:</p>
             <a href="${verifyUrl}">Verify Email</a>`,
    });

    return res.status(200).json({
      success: true,
      message:
        "Verification email sent! Please check your inbox and click the verification link to complete your registration.",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Registration failed, please try again later",
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user already exists (in case they click the link multiple times)
    const existingUser = await User.findOne({ email: decoded.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Account already exists. Please login instead.",
      });
    }

    // ✅ NOW CREATE THE USER ACCOUNT
    const user = await User.create({
      name: decoded.name,
      email: decoded.email,
      password: decoded.password, // Already hashed
      role: decoded.role,
      isVerified: true, // Account is verified upon creation
    });

    console.log("✅ User account created successfully:", user.email);

    res.status(200).json({
      success: true,
      message:
        "Email verified successfully! Your account has been created. You can now login.",
    });
  } catch (err) {
    console.log("❌ Email verification failed:", err);

    if (err.name === "TokenExpiredError") {
      res.status(400).json({
        success: false,
        message: "Verification link has expired. Please sign up again.",
      });
    } else if (err.name === "JsonWebTokenError") {
      res.status(400).json({
        success: false,
        message: "Invalid verification link.",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Verification failed. Please try signing up again.",
      });
    }
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
        expiresIn: "24h",
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

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    // Verify the Google JWT token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google email is not verified",
      });
    }

    // Check if user exists or create new user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user with Google data
      user = await User.create({
        email,
        name: name || "Google User", // ✅ Use 'name' instead
        avatar: picture,
        role: "Customer", // ✅ Use valid enum value
        isGoogleUser: true,
      });
    }

    // Create JWT payload exactly like in regular login
    const jwtPayload = {
      email: user.email,
      id: user._id,
      role: user.role,
    };

    // Generate JWT token with same settings as regular login
    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Prepare user object (remove sensitive data)
    user = user.toObject();
    user.token = token;
    user.password = undefined;

    // Set cookie options exactly like regular login
    const options = {
      expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    // Send response exactly like regular login
    res.cookie("token", token, options).status(200).json({
      success: true,
      token,
      user,
      message: "Google login successful",
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({
      success: false,
      message: error,
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
