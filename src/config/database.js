const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// dotenv.config();
const { DB_URL } = require("./config");
// const DB_URL = process.env.DB_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URL);
    console.log("Database connected");
  } catch (error) {
    // console.log(error);
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;