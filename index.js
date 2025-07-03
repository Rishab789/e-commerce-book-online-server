const express = require("express");
const app = express();
const cors = require("cors");

require("dotenv").config();

const PORT = process.env.PORT || 8000;

// const fileupload = require("express-fileupload");
// app.use(
//   fileupload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//   })
// );

const cloudinary = require("./config/cloudinary");
cloudinary.cloudinaryConnect();

const allowedOrigins = [
  "http://localhost:1234",
  "https://novelez-prod.netlify.app/",
];

// app.use(
//   cors({
//     origin: process.env.ORIGIN, // Allow only your frontend's origin
//     methods: "GET, POST, PUT, DELETE",
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

const cookieParser = require("cookie-parser");

app.use(cookieParser());
app.use(express.json());

const user = require("./routes/user");
const otpMail = require("./routes/otpMailRoute");
const eBook = require("./routes/eBookRoutes");
const bestSelling = require("./routes/bestSellingRoutes");
const products = require("./routes/productsRoutes");
const blogs = require("./routes/blog.routes");
const mail = require("./routes/mail");

app.use("/api/v1", user);
app.use("/api/v1", otpMail);
app.use("/api/v1", eBook);
app.use("/api/v1", bestSelling);
app.use("/api/v1", products);
app.use("/api/v1", blogs);
app.use("/api/v1", mail);

app.listen(PORT, () => {
  console.log(`App started on port number ${PORT}`);
});

app.get("/", (req, res) => {
  res.send(`Server started on Port Number ${PORT}`);
});
require("./config/database").connectWithDB();
