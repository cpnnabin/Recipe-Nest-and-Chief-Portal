const mongoose = require("mongoose");
const { DB_URI } = require("./config");

async function connectDB() {
    try {
        await mongoose.connect(DB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        throw error;
    }
}

module.exports = connectDB;