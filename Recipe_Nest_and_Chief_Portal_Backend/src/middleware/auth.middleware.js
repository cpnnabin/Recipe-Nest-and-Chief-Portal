// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { JWT_SECRET } = require("../config/config");

const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Please login.",
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found with this token.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Not authorized. Token is invalid or expired.",
        });
    }
};

// Admin only middleware (must be used AFTER protect)
const adminOnly = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "chief")) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
    });
};

// Optional: Regular user or admin
const userOnly = (req, res, next) => {
    if (req.user && (req.user.role === "user" || req.user.role === "admin" || req.user.role === "chief")) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Access denied. User access required.",
    });
};

module.exports = {
    protect,
    adminOnly,
    userOnly,
};