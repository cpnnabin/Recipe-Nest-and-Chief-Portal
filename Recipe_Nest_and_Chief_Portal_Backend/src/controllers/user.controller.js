const userService = require("../services/user.service");
const { NODE_ENV } = require("../config/config");

// Simple validation helper - easy for beginners to understand
const validateRegister = (data) => {
    const errors = [];

    if (!data.name || data.name.trim() === "") {
        errors.push("Name is required");
    }

    if (!data.email || data.email.trim() === "") {
        errors.push("Email is required")  ;
    } else if (!data.email.includes("@")) {
        errors.push("Please provide a valid email address");
    }

    if (!data.password || data.password === "") {
        errors.push("Password is required");
    } else if (data.password.length < 6) {
        errors.push("Password must be at least 6 characters");
    }

    return errors;
};

const validateLogin = (data) => {
    const errors = [];

    if (!data.email || data.email.trim() === "") {
        errors.push("Email is required");
    }

    if (!data.password || data.password === "") {
        errors.push("Password is required");
    }

    return errors;
};

const validateUpdateProfile = (data) => {
    const errors = [];
    const allowedFields = ["name", "phone", "address", "avatar"];

    const updateKeys = Object.keys(data);
    const invalidFields = updateKeys.filter(key => !allowedFields.includes(key));

    if (invalidFields.length > 0) {
        errors.push(`Cannot update these fields: ${invalidFields.join(", ")}`);
    }

    return errors;
};

const validateChangePassword = (data) => {
    const errors = [];

    if (!data.currentPassword || data.currentPassword === "") {
        errors.push("Current password is required");
    }

    if (!data.newPassword || data.newPassword === "") {
        errors.push("New password is required");
    } else if (data.newPassword.length < 6) {
        errors.push("New password must be at least 6 characters");
    }

    return errors;
};

const validateForgotPassword = (data) => {
    const errors = [];

    if (!data.email || data.email.trim() === "") {
        errors.push("Email is required");
    }

    return errors;
};

const validateResetPassword = (data) => {
    const errors = [];

    if (!data.newPassword || data.newPassword === "") {
        errors.push("New password is required");
    } else if (data.newPassword.length < 6) {
        errors.push("New password must be at least 6 characters");
    }

    return errors;
};

const handleError = (res, error) => {
    console.error("Controller Error:", error.message);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error",
        ...(NODE_ENV === "development" && { stack: error.stack }),
    });
};

const register = async (req, res) => {
    try {
        // Simple validation
        const errors = validateRegister(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors,
            });
        }

        const { name, email, password, role, phone, address } = req.body;
        const result = await userService.registerUser({ name, email, password, role, phone, address });
        res.status(201).json({ success: true, message: result.message, data: result.data });
    } catch (error) {
        handleError(res, error);
    }
};

const login = async (req, res) => {
    try {
        // Simple validation
        const errors = validateLogin(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors,
            });
        }

        const { email, password } = req.body;
        const result = await userService.loginUser(email, password);

        // IMPORTANT: Return both `token` and `jwtToken` for frontend compatibility
        res.status(200).json({
            success: true,
            message: result.message,
            token: result.jwtToken,
            jwtToken: result.jwtToken,
            name: result.name,
            username: result.username,
            email: result.email,
            role: result.role,
            data: {
                user: {
                    name: result.name,
                    username: result.username,
                    email: result.email,
                    role: result.role,
                },
            },
        });
    } catch (error) {
        handleError(res, error);
    }
};
const getProfile = async (req, res) => {
    try {
        const result = await userService.getUserProfile(req.user.id);
        res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        handleError(res, error);
    }
};

const updateProfile = async (req, res) => {
    try {
        // Simple validation
        const errors = validateUpdateProfile(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors,
            });
        }

        const result = await userService.updateUserProfile(req.user.id, req.body);
        res.status(200).json({ success: true, message: result.message, data: result.data });
    } catch (error) {
        handleError(res, error);
    }
};

const getAllUsers = async (req, res) => {
    try {
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 100,
            includeInactive: req.query.includeInactive === "true",
        };

        const result = await userService.getAllUsers(options);

        // ✅ Fixed: Send users directly in a clean structure
        const pagination = result.data?.pagination || null;
        res.status(200).json({
            success: true,
            users: result.data?.users || [],
            pagination,
            totalCount: pagination?.total ?? 0,
        });

    } catch (error) {
        handleError(res, error);
    }
};

const getUserById = async (req, res) => {
    try {
        const result = await userService.getUserProfile(req.params.id);
        res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        handleError(res, error);
    }
};

const getPublicUserById = async (req, res) => {
    try {
        const result = await userService.getPublicUserProfile(req.params.id);
        res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        handleError(res, error);
    }
};

const changePassword = async (req, res) => {
    try {
        // Simple validation
        const errors = validateChangePassword(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors,
            });
        }

        const { currentPassword, newPassword } = req.body;
        const result = await userService.changePassword(req.user.id, currentPassword, newPassword);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        handleError(res, error);
    }
};

const forgotPassword = async (req, res) => {
    try {
        const errors = validateForgotPassword(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const result = await userService.requestPasswordReset(req.body.email);
        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        handleError(res, error);
    }
};

const resetPassword = async (req, res) => {
    try {
        const errors = validateResetPassword(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const { token } = req.params;
        const { newPassword } = req.body;
        const result = await userService.resetPassword(token, newPassword);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        handleError(res, error);
    }
};

const deactivateUser = async (req, res) => {
    try {
        const result = await userService.deactivateUser(req.params.id);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        handleError(res, error);
    }
};

const createUser = async (req, res) => {
    try {
        // Simple validation (same as register)
        const errors = validateRegister(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors,
            });
        }

        const { name, email, password, role } = req.body;
        const result = await userService.registerUser({ name, email, password, role });
        res.status(201).json({ success: true, message: result.message, data: result.data });
    } catch (error) {
        handleError(res, error);
    }
};

const logout = async (req, res) => {
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

/**
 * Update user's avatar/profile picture
 * This function is called after multer middleware processes the file upload
 * req.file contains the uploaded file information
 */
const updateAvatar = async (req, res) => {
    try {
        // Check if file was uploaded by multer
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an image file",
            });
        }

        const result = await userService.updateAvatar(req.user.id, req.file);

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        handleError(res, error);
    }
};

/**
 * Delete user's avatar (reset to default)
 */
const deleteAvatar = async (req, res) => {
    try {
        const result = await userService.deleteAvatar(req.user.id);

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data,
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    getAllUsers,
    getUserById,
    getPublicUserById,
    changePassword,
    forgotPassword,
    resetPassword,
    deactivateUser,
    createUser,
    logout,
    updateAvatar,
    deleteAvatar,
};