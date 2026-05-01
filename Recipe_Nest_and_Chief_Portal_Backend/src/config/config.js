require("dotenv").config();


module.exports = {
    // server configuration
    PORT: process.env.PORT || 8080,
    NODE_ENV : process.env.NODE_ENV || "development",

    // database configuration
    DB_URI:
        process.env.DB_URI ||
        process.env.DB_URL ||
        "mongodb://localhost:27017/recipe_nest_and_chief_portal",

    // jwt configuration
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",

    // other configurations can be added here

    //CORS configuration
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

};

