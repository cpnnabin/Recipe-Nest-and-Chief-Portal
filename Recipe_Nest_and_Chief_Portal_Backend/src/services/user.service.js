const User = require("../models/users.models");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getFileUrl, deleteOldFile } = require("../config/multer");

const VALID_ROLES = new Set(["customer", "user", "admin", "chief"]);

const normalizeRole = (role) => {
    const normalized = String(role || "customer").toLowerCase().trim();
    return VALID_ROLES.has(normalized) ? normalized : "customer";
};

// register user
const registerUser = async (userData) =>{
    try{
        const exitsingUser = await User.findOne({email : userData.email});
        if(exitsingUser){
            throw new Error("User already exists");
        }

        const user = new User({
            name : userData.name,
            email : userData.email,
            password : userData.password,
            role : normalizeRole(userData.role),
            phone : userData.phone,
            address : userData.address
        })
        await user.save();

        return {
            success : true,
            message : "User registered successfully",
            data : {user},
        };
    } catch(error) {
        console.error("Error registering user:", error);
        throw error;
    }
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// login user
// login user
const loginUser = async (email, password) => {
    try {
        const trimmed = String(email || "").trim();
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") },
        }).select("+password");

        if (!user) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            throw error;
        }

        if (!user.isActive) {
            const error = new Error("Your account has been deactivated");
            error.statusCode = 403;
            throw error;
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            throw error;
        }

        // Generate token using your model method (which already includes role)
        const token = user.generateJWT();

        const userObject = user.toObject();
        delete userObject.password;

        return {
            success: true,
            message: "Login successful",
            jwtToken: token,
            name: userObject.name,
            username: userObject.username || userObject.name,
            email: userObject.email,
            role: userObject.role,
        };
    } catch (error) {
        console.error("Error in loginUser:", error.message);
        throw error;
    }
};

const getUserProfile = async (userId) => {
    try {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        return { success: true, data: { user } };
    } catch (error) {
        console.error("Error in getUserProfile:", error.message);
        throw error;
    }
};

const getPublicUserProfile = async (userId) => {
    try {
        const user = await User.findById(userId).select("name avatar role createdAt");
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        return { success: true, data: { user } };
    } catch (error) {
        console.error("Error in getPublicUserProfile:", error.message);
        throw error;
    }
};

const updateUserProfile = async (userId, updateData) => {
    try {
        const allowedUpdates = ["name", "phone", "address", "avatar"];
        const filteredData = {};
        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                filteredData[key] = updateData[key];
            }
        }

        const user = await User.findByIdAndUpdate(userId, filteredData, {
            new: true,
            runValidators: true,
        }).select("-password");

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        return {
            success: true,
            message: "Profile updated successfully",
            data: { user },
        };
    } catch (error) {
        console.error("Error in updateUserProfile:", error.message);
        throw error;
    }
};

const getAllUsers = async (options = {}) => {
    try {
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 10;
        const skip = (page - 1) * limit;
        const query = options.includeInactive ? {} : { isActive: true };

        const users = await User.find(query)
            .select("-password")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        return {
            success: true,
            data: {
                users,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            },
        };
    } catch (error) {
        console.error("Error in getAllUsers:", error.message);
        throw error;
    }
};

const changePassword = async (userId, currentPassword, newPassword) => {
    try {
        const user = await User.findById(userId).select("+password");
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            const error = new Error("Current password is incorrect");
            error.statusCode = 400;
            throw error;
        }

        user.password = newPassword;
        await user.save();

        return { success: true, message: "Password changed successfully" };
    } catch (error) {
        console.error("Error in changePassword:", error.message);
        throw error;
    }
};

const requestPasswordReset = async (email) => {
    try {
        const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpires");

        if (!user) {
            const error = new Error("If the email exists, a reset token will be generated");
            error.statusCode = 404;
            throw error;
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpires = resetPasswordExpires;
        await user.save();

        return {
            success: true,
            message: "Password reset token generated successfully",
            data: {
                resetToken,
                resetPasswordExpires,
                resetUrl: `/reset-password/${resetToken}`,
            },
        };
    } catch (error) {
        console.error("Error in requestPasswordReset:", error.message);
        throw error;
    }
};

const resetPassword = async (resetToken, newPassword) => {
    try {
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() },
        }).select("+password +resetPasswordToken +resetPasswordExpires");

        if (!user) {
            const error = new Error("Reset token is invalid or has expired");
            error.statusCode = 400;
            throw error;
        }

        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        return {
            success: true,
            message: "Password reset successfully",
        };
    } catch (error) {
        console.error("Error in resetPassword:", error.message);
        throw error;
    }
};

const deactivateUser = async (userId) => {
    try {
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        return { success: true, message: "User deleted successfully" };
    } catch (error) {
        console.error("Error in deactivateUser:", error.message);
        throw error;
    }
};

/**
 * Update user's avatar
 * @param {string} userId - User ID
 * @param {Object} file - Uploaded file object from multer
 * @returns {Object} Updated user with new avatar URL
 */
const updateAvatar = async (userId, file) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        // Delete old avatar if exists (not the default one)
        if (user.avatar) {
            const oldFilename = user.avatar.split("/").pop();
            deleteOldFile(oldFilename, "profilePic");
        }

        // Update with new avatar URL
        const avatarUrl = getFileUrl(file.filename, "profilePic");
        user.avatar = avatarUrl;
        await user.save();

        return {
            success: true,
            message: "Avatar updated successfully",
            data: {
                user,
                avatarUrl,
            },
        };
    } catch (error) {
        console.error("Error in updateAvatar:", error.message);
        throw error;
    }
};

/**
 * Delete user's avatar (reset to default)
 * @param {string} userId - User ID
 * @returns {Object} Success message
 */
const deleteAvatar = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        // Delete old avatar file if exists
        if (user.avatar) {
            const oldFilename = user.avatar.split("/").pop();
            deleteOldFile(oldFilename, "profilePic");
        }

        // Reset avatar to null (default)
        user.avatar = null;
        await user.save();

        return {
            success: true,
            message: "Avatar removed successfully",
            data: { user },
        };
    } catch (error) {
        console.error("Error in deleteAvatar:", error.message);
        throw error;
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    getPublicUserProfile,
    updateUserProfile,
    getAllUsers,
    changePassword,
    requestPasswordReset,
    resetPassword,
    deactivateUser,
    updateAvatar,
    deleteAvatar,
};