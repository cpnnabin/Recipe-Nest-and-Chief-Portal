const express = require("express");
const router = express.Router();

// import middlewares
const { protect, adminOnly } = require("../middleware/auth.middleware");

// import controllers
const userController = require("../controllers/user.controller");

const { profilePicUpload } = require("../config/multer");

const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: err.message, // "Unexpected field", "File too large", etc.
        });
    }
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
    next();
};


// public routes

// register a new user
router.post("/register", profilePicUpload.none(), userController.register);

// login user
router.post("/login", profilePicUpload.none(), userController.login);

// public user profile by id (for chef pages)
router.get("/public/:id", userController.getPublicUserById);

// request password reset token
router.post("/forgot-password", profilePicUpload.none(), userController.forgotPassword);

// reset password using token
router.patch("/reset-password/:token", profilePicUpload.none(), userController.resetPassword);

// protected routes

// get the current user's profile
router.get("/profile", protect, userController.getProfile);

// update the current user's profile
router.put("/profile", protect, profilePicUpload.none(), userController.updateProfile);

// change current user's password
router.patch("/change-password", protect, profilePicUpload.none(), userController.changePassword);

// logout user
router.post("/logout", protect, userController.logout);

// api/users/avatar
router.patch("/avatar", protect, profilePicUpload.single("avatar"), userController.updateAvatar);

// delete avatar
router.delete("/avatar", protect, userController.deleteAvatar);

// admin routes
router.get("/", protect, adminOnly, userController.getAllUsers);

// get user by id
router.get("/:id", protect, adminOnly, userController.getUserById);

// delete user by id
router.delete("/:id", protect, adminOnly, userController.deactivateUser);


module.exports = router;