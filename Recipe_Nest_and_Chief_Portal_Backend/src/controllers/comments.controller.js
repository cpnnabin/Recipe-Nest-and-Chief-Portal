/**
 * Comment Controller
 *
 * Handles the HTTP request/response cycle for all comment endpoints.
 * Delegates all business logic to commentService.
 */

const commentService = require("../services/comments.services");

// ─────────────────────────────────────────────
// Helper — sends a consistent success response
// ─────────────────────────────────────────────
const sendSuccess = (res, statusCode, message, data = {}) => {
    res.status(statusCode).json({ success: true, message, ...data });
};

// ─────────────────────────────────────────────
// Helper — centralised error handler
// ─────────────────────────────────────────────
const handleError = (res, error) => {
    console.error("Comment Controller Error:", error.message);
    const status = error.statusCode || 500;
    const message = error.message || "Internal server error";
    res.status(status).json({ success: false, message });
};

// ─────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────
const validateCreateComment = (data) => {
    const errors = [];

    if (!data.content || data.content.trim() === "") {
        errors.push("Comment content is required");
    } else if (data.content.trim().length < 2) {
        errors.push("Comment must be at least 2 characters");
    } else if (data.content.trim().length > 1000) {
        errors.push("Comment cannot exceed 1000 characters");
    }

    if (data.rating !== undefined && data.rating !== null) {
        const rating = Number(data.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            errors.push("Rating must be a number between 1 and 5");
        }
    }

    return errors;
};

const validateUpdateComment = (data) => {
    const errors = [];

    if (data.content !== undefined) {
        if (data.content.trim() === "") {
            errors.push("Comment content cannot be empty");
        } else if (data.content.trim().length < 2) {
            errors.push("Comment must be at least 2 characters");
        } else if (data.content.trim().length > 1000) {
            errors.push("Comment cannot exceed 1000 characters");
        }
    }

    if (data.rating !== undefined && data.rating !== null) {
        const rating = Number(data.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            errors.push("Rating must be a number between 1 and 5");
        }
    }

    if (data.content === undefined && data.rating === undefined) {
        errors.push("Provide at least one field to update: content or rating");
    }

    return errors;
};

// ═════════════════════════════════════════════
// @route   POST /api/comments/recipe/:recipeId
// @desc    Add a comment (or reply) to a recipe
// @access  Private (authenticated users)
// ═════════════════════════════════════════════
const createComment = async (req, res) => {
    try {
        const errors = validateCreateComment(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed", errors });
        }

        const { content, rating, parentComment } = req.body;

        const comment = await commentService.createComment(
            { content, rating, parentComment },
            req.user._id,
            req.params.recipeId
        );

        sendSuccess(res, 201, "Comment added successfully", { comment });
    } catch (error) {
        handleError(res, error);
    }
};

// ═════════════════════════════════════════════
// @route   GET /api/comments/recipe/:recipeId
// @desc    Get all top-level comments for a recipe (with inline replies)
// @access  Public
// ═════════════════════════════════════════════
const getCommentsByRecipe = async (req, res) => {
    try {
        const result = await commentService.getCommentsByRecipe(
            req.params.recipeId,
            req.query
        );
        sendSuccess(res, 200, "Comments fetched successfully", result);
    } catch (error) {
        handleError(res, error);
    }
};

// ═════════════════════════════════════════════
// @route   GET /api/comments/:commentId/replies
// @desc    Get all replies for a specific comment
// @access  Public
// ═════════════════════════════════════════════
const getRepliesByComment = async (req, res) => {
    try {
        const result = await commentService.getRepliesByComment(
            req.params.commentId,
            req.query
        );
        sendSuccess(res, 200, "Replies fetched successfully", result);
    } catch (error) {
        handleError(res, error);
    }
};

// ═════════════════════════════════════════════
// @route   GET /api/comments/user/:userId
// @desc    Get all comments written by a specific user
// @access  Public
// ═════════════════════════════════════════════
const getCommentsByUser = async (req, res) => {
    try {
        const result = await commentService.getCommentsByUser(
            req.params.userId,
            req.query
        );
        sendSuccess(res, 200, "User comments fetched successfully", result);
    } catch (error) {
        handleError(res, error);
    }
};

// ═════════════════════════════════════════════
// @route   GET /api/comments/my-comments
// @desc    Get all comments written by the logged-in user
// @access  Private
// ═════════════════════════════════════════════
const getMyComments = async (req, res) => {
    try {
        const result = await commentService.getCommentsByUser(
            req.user._id,
            req.query
        );
        sendSuccess(res, 200, "Your comments fetched successfully", result);
    } catch (error) {
        handleError(res, error);
    }
};

// ═════════════════════════════════════════════
// @route   GET /api/comments/:commentId
// @desc    Get a single comment by ID
// @access  Public
// ═════════════════════════════════════════════
const getCommentById = async (req, res) => {
    try {
        const comment = await commentService.getCommentById(req.params.commentId);
        sendSuccess(res, 200, "Comment fetched successfully", { comment });
    } catch (error) {
        handleError(res, error);
    }
};

// ═════════════════════════════════════════════
// @route   PUT /api/comments/:commentId
// @desc    Edit a comment's content or rating
// @access  Private (owner only)
// ═════════════════════════════════════════════
const updateComment = async (req, res) => {
    try {
        const errors = validateUpdateComment(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: "Validation failed", errors });
        }

        const { content, rating } = req.body;

        const comment = await commentService.updateComment(
            req.params.commentId,
            req.user._id,
            { content, rating }
        );

        sendSuccess(res, 200, "Comment updated successfully", { comment });
    } catch (error) {
        handleError(res, error);
    }
};

// ═════════════════════════════════════════════
// @route   DELETE /api/comments/:commentId
// @desc    Delete a comment (soft delete)
// @access  Private (owner or admin)
// ═════════════════════════════════════════════
const deleteComment = async (req, res) => {
    try {
        await commentService.deleteComment(
            req.params.commentId,
            req.user._id,
            req.user.role
        );
        sendSuccess(res, 200, "Comment deleted successfully");
    } catch (error) {
        handleError(res, error);
    }
};

// ═════════════════════════════════════════════
// @route   POST /api/comments/:commentId/like
// @desc    Toggle like / unlike on a comment
// @access  Private
// ═════════════════════════════════════════════
const toggleLikeComment = async (req, res) => {
    try {
        const result = await commentService.toggleLikeComment(
            req.params.commentId,
            req.user._id
        );
        const message = result.liked ? "Comment liked" : "Comment unliked";
        sendSuccess(res, 200, message, result);
    } catch (error) {
        handleError(res, error);
    }
};

// ═════════════════════════════════════════════
// @route   GET /api/comments              (Admin)
// @desc    Get all comments in the system
// @access  Private (admin only)
// ═════════════════════════════════════════════
const getAllComments = async (req, res) => {
    try {
        const result = await commentService.getAllComments(req.query);
        sendSuccess(res, 200, "All comments fetched successfully", result);
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    createComment,
    getCommentsByRecipe,
    getRepliesByComment,
    getCommentsByUser,
    getMyComments,
    getCommentById,
    updateComment,
    deleteComment,
    toggleLikeComment,
    getAllComments,
};