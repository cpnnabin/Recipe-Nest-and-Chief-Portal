const express = require("express");
const cors = require("cors");
const path = require("path");

const { NODE_ENV, CLIENT_URL } = require("./config/config");
const userRoutes = require("./routes/user.routes");
const recipeRoutes = require("./routes/recipe.routes");
const commentRoutes = require("./routes/comment.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// ====================== MIDDLEWARE ======================
app.use(cors({
    origin: CLIENT_URL,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (NODE_ENV === "development") {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

// ====================== STATIC FILE SERVING (FIXED) ======================
const uploadsRoot = path.join(__dirname, "../uploads");
const profilePicsPath = path.join(uploadsRoot, "profile_pics");
const recipeImagesPath = path.join(uploadsRoot, "recipe_images");

console.log("✅ Serving uploads from:", uploadsRoot);
console.log("✅ Profile pics folder:", profilePicsPath);
console.log("✅ Recipe images folder:", recipeImagesPath);

// Serve static files
app.use("/uploads", express.static(uploadsRoot));

// Extra safety routes (supports both correct and incorrect folder names in DB)
app.use("/uploads/profile_pics", express.static(profilePicsPath));
app.use("/uploads/profilePics", express.static(profilePicsPath));   // for old records with capital P

console.log("✅ Static middleware for /uploads registered successfully");

// Health check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Recipe-Nest API",
        version: "1.0.0",
        status: "running",
    });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/admin", adminRoutes);

// ====================== ERROR HANDLING ======================
// 404 handler - MUST be after static middleware and routes
app.use((req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        statusCode,
    });
});

module.exports = app;