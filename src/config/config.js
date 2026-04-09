require("dotenv").config();

module.exports = {
  // Server
  PORT: process.env.PORT || 8080,
  
  // Database
  DB_URL: process.env.DB_URL || "mongodb://localhost:27017/recipe_nest_and_chief_portal",
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  
  // CORS
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
};