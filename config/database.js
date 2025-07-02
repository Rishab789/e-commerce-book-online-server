const mongoose = require("mongoose");
require("dotenv").config();

exports.connectWithDB = () => {
  mongoose
    .connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(console.log("DB Connected Successfully"))
    .catch((error) => {
      console.log(error);
      console.log("Error in Connecting to DB");
      process.exit(1);
    });
};
