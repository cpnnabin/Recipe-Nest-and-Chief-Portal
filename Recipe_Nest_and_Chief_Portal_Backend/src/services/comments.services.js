/**
 * Comment Services
 *
 * Contains all business logic for comment operations.
 * Controllers call these methods — keeping concerns separated.
 * When a rated comment is created or deleted the Recipe's
 * averageRating and totalReviews fields are kept in sync.
 */

const Comment = require("../models/comments.models");
const Recipe = require("../models/recipes.models");

// ═════════════════════════════════════════════
// HELPER — recalculate a recipe's averageRating / totalReviews
// ═════════════════════════════════════════════

/**
 * Recalculate and persist the averageRating + totalReviews on a Recipe.
 * Called whenever a rated top-level comment is created or deleted.
 * @param {String} recipeId
 */
const _recalculateRecipeRating = async (recipeId) => {
    const result = await Comment.aggregate([
        {
            $match: {
                recipe: recipeId,
                rating: { $ne: null },
                parentComment: null,
                isDeleted: false,
            },
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
            },
        },
    ]);

    const avg = result.length > 0 ? Math.round(result[0].averageRating * 10) / 10 : 0;
    const total = result.length > 0 ? result[0].totalReviews : 0;

    await Recipe.findByIdAndUpdate(recipeId, {
        averageRating: avg,
        totalReviews: total,
    });
};

// ═════════════════════════════════════════════
// CREATE
// ═════════════════════════════════════════════

/**
 * Add a new comment (or reply) to a recipe.
 * - Replies cannot carry a rating.
 * - A user may only submit one rating per recipe.
 * @param {Object} commentData  - { content, rating?, parentComment? }
 * @param {String} authorId     - Authenticated user's ID
 * @param {String} recipeId     - Target recipe ID
 * @returns {Promise<Comment>}
 */
const createComment = async (commentData, authorId, recipeId) => {
    // Confirm the recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
        const error = new Error("Recipe not found");
        error.statusCode = 404;
        throw error;
    }

    // If this is a reply, validate the parent comment exists on the same recipe
    if (commentData.parentComment) {
        const parent = await Comment.findById(commentData.parentComment);
        if (!parent || parent.recipe.toString() !== recipeId.toString()) {
            const error = new Error("Parent comment not found on this recipe");
            error.statusCode = 404;
            throw error;
        }

        // Replies cannot carry ratings
        if (commentData.rating) {
            const error = new Error("Replies cannot include a rating");
            error.statusCode = 400;
            throw error;
        }
    }

    // Prevent duplicate ratings from the same user on the same recipe
    if (commentData.rating && !commentData.parentComment) {
        const existingRating = await Comment.hasUserRated(recipeId, authorId);
        if (existingRating) {
            const error = new Error("You have already rated this recipe");
            error.statusCode = 409;
            throw error;
        }
    }

    const comment = await Comment.create({
        content: commentData.content,
        rating: commentData.rating || null,
        parentComment: commentData.parentComment || null,
        author: authorId,
        recipe: recipeId,
    });

    // Sync recipe rating counters if this comment carries a rating
    if (comment.rating && !comment.parentComment) {
        await _recalculateRecipeRating(recipe._id);
    }

    // Return comment with author info populated
    return comment.populate("author", "name avatar");
};

// ═════════════════════════════════════════════
// READ — ALL COMMENTS FOR A RECIPE
// ═════════════════════════════════════════════

/**
 * Get paginated top-level comments for a recipe, each with up to
 * a limited number of inline replies.
 * @param {String} recipeId
 * @param {Object} queryParams  - { page, limit }
 * @returns {Promise<{comments, totalCount, totalPages, currentPage}>}
 */
const getCommentsByRecipe = async (recipeId, queryParams = {}) => {
    const { page = 1, limit = 10 } = queryParams;

    // Confirm the recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
        const error = new Error("Recipe not found");
        error.statusCode = 404;
        throw error;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [comments, totalCount] = await Promise.all([
        Comment.find({ recipe: recipeId, parentComment: null, isDeleted: false })
            .sort("-createdAt")
            .skip(skip)
            .limit(Number(limit))
            .populate("author", "name avatar")
            .populate({
                path: "replies",
                match: { isDeleted: false },
                options: { sort: { createdAt: 1 }, limit: 3 },
                populate: { path: "author", select: "name avatar" },
            }),
        Comment.countDocuments({ recipe: recipeId, parentComment: null, isDeleted: false }),
    ]);

    return {
        comments,
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: Number(page),
    };
};

// ═════════════════════════════════════════════
// READ — REPLIES FOR A SINGLE COMMENT
// ═════════════════════════════════════════════

/**
 * Get all replies for a specific comment (paginated).
 * @param {String} commentId
 * @param {Object} queryParams  - { page, limit }
 * @returns {Promise<{replies, totalCount, totalPages, currentPage}>}
 */
const getRepliesByComment = async (commentId, queryParams = {}) => {
    const { page = 1, limit = 10 } = queryParams;

    const parent = await Comment.findById(commentId);
    if (!parent || parent.isDeleted) {
        const error = new Error("Comment not found");
        error.statusCode = 404;
        throw error;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [replies, totalCount] = await Promise.all([
        Comment.find({ parentComment: commentId, isDeleted: false })
            .sort("createdAt")
            .skip(skip)
            .limit(Number(limit))
            .populate("author", "name avatar"),
        Comment.countDocuments({ parentComment: commentId, isDeleted: false }),
    ]);

    return {
        replies,
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: Number(page),
    };
};

// ═════════════════════════════════════════════
// READ — COMMENTS BY USER
// ═════════════════════════════════════════════

/**
 * Get all comments written by a specific user (paginated).
 * @param {String} userId
 * @param {Object} queryParams  - { page, limit }
 * @returns {Promise<{comments, totalCount, totalPages, currentPage}>}
 */
const getCommentsByUser = async (userId, queryParams = {}) => {
    const { page = 1, limit = 10 } = queryParams;
    const skip = (Number(page) - 1) * Number(limit);

    const [comments, totalCount] = await Promise.all([
        Comment.find({ author: userId, isDeleted: false })
            .sort("-createdAt")
            .skip(skip)
            .limit(Number(limit))
            .populate("recipe", "title thumbnail"),
        Comment.countDocuments({ author: userId, isDeleted: false }),
    ]);

    return {
        comments,
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: Number(page),
    };
};

// ═════════════════════════════════════════════
// READ — SINGLE COMMENT
// ═════════════════════════════════════════════

/**
 * Get a single comment by ID.
 * @param {String} commentId
 * @returns {Promise<Comment>}
 */
const getCommentById = async (commentId) => {
    const comment = await Comment.findOne({ _id: commentId, isDeleted: false })
        .populate("author", "name avatar")
        .populate({
            path: "replies",
            match: { isDeleted: false },
            options: { sort: { createdAt: 1 } },
            populate: { path: "author", select: "name avatar" },
        });

    if (!comment) {
        const error = new Error("Comment not found");
        error.statusCode = 404;
        throw error;
    }

    return comment;
};

// ═════════════════════════════════════════════
// UPDATE
// ═════════════════════════════════════════════

/**
 * Edit the content (and optionally the rating) of a comment.
 * Only the original author may edit their comment.
 * @param {String} commentId
 * @param {String} authorId     - Must match comment.author
 * @param {Object} updateData   - { content?, rating? }
 * @returns {Promise<Comment>}
 */
const updateComment = async (commentId, authorId, updateData) => {
    const comment = await Comment.findOne({ _id: commentId, isDeleted: false });
    if (!comment) {
        const error = new Error("Comment not found");
        error.statusCode = 404;
        throw error;
    }

    // Ownership check
    if (comment.author.toString() !== authorId.toString()) {
        const error = new Error("You are not authorized to edit this comment");
        error.statusCode = 403;
        throw error;
    }

    // Replies cannot carry ratings
    if (updateData.rating && comment.parentComment) {
        const error = new Error("Replies cannot include a rating");
        error.statusCode = 400;
        throw error;
    }

    if (updateData.content !== undefined) comment.content = updateData.content;
    if (updateData.rating !== undefined) comment.rating = updateData.rating;
    comment.isEdited = true;

    await comment.save();

    // Resync recipe rating if the rating changed
    if (updateData.rating !== undefined && !comment.parentComment) {
        await _recalculateRecipeRating(comment.recipe);
    }

    return comment.populate("author", "name avatar");
};

// ═════════════════════════════════════════════
// DELETE
// ═════════════════════════════════════════════

/**
 * Soft-delete a comment (only author or admin).
 * Replies are also soft-deleted when their parent is deleted.
 * @param {String} commentId
 * @param {String} authorId
 * @param {String} userRole   - "admin" can delete any comment
 * @returns {Promise<void>}
 */
const deleteComment = async (commentId, authorId, userRole) => {
    const comment = await Comment.findOne({ _id: commentId, isDeleted: false });
    if (!comment) {
        const error = new Error("Comment not found");
        error.statusCode = 404;
        throw error;
    }

    const isOwner = comment.author.toString() === authorId.toString();
    const isAdmin = userRole === "admin" || userRole === "chief";

    if (!isOwner && !isAdmin) {
        const error = new Error("You are not authorized to delete this comment");
        error.statusCode = 403;
        throw error;
    }

    // Soft-delete this comment and all its replies
    comment.isDeleted = true;
    await comment.save();
    await Comment.updateMany({ parentComment: commentId }, { isDeleted: true });

    // Resync recipe rating if the deleted comment carried a rating
    if (comment.rating && !comment.parentComment) {
        await _recalculateRecipeRating(comment.recipe);
    }
};

// ═════════════════════════════════════════════
// LIKE / UNLIKE
// ═════════════════════════════════════════════

/**
 * Toggle like / unlike on a comment.
 * @param {String} commentId
 * @param {String} userId
 * @returns {Promise<{liked: Boolean, likeCount: Number}>}
 */
const toggleLikeComment = async (commentId, userId) => {
    const comment = await Comment.findOne({ _id: commentId, isDeleted: false });
    if (!comment) {
        const error = new Error("Comment not found");
        error.statusCode = 404;
        throw error;
    }

    const alreadyLiked = comment.isLikedByUser(userId);

    if (alreadyLiked) {
        await Comment.findByIdAndUpdate(commentId, {
            $pull: { likes: userId },
            $inc: { likeCount: -1 },
        });
        return { liked: false, likeCount: comment.likeCount - 1 };
    } else {
        await Comment.findByIdAndUpdate(commentId, {
            $addToSet: { likes: userId },
            $inc: { likeCount: 1 },
        });
        return { liked: true, likeCount: comment.likeCount + 1 };
    }
};

// ═════════════════════════════════════════════
// ADMIN
// ═════════════════════════════════════════════

/**
 * Get all comments in the system (admin dashboard), paginated.
 * @param {Object} queryParams  - { page, limit, recipeId?, authorId? }
 * @returns {Promise<{comments, totalCount, totalPages, currentPage}>}
 */
const getAllComments = async (queryParams = {}) => {
    const { page = 1, limit = 20, recipeId, authorId } = queryParams;

    const filter = { isDeleted: false };
    if (recipeId) filter.recipe = recipeId;
    if (authorId) filter.author = authorId;

    const skip = (Number(page) - 1) * Number(limit);

    const [comments, totalCount] = await Promise.all([
        Comment.find(filter)
            .sort("-createdAt")
            .skip(skip)
            .limit(Number(limit))
            .populate("author", "name email avatar")
            .populate("recipe", "title"),
        Comment.countDocuments(filter),
    ]);

    return {
        comments,
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: Number(page),
    };
};

module.exports = {
    createComment,
    getCommentsByRecipe,
    getRepliesByComment,
    getCommentsByUser,
    getCommentById,
    updateComment,
    deleteComment,
    toggleLikeComment,
    getAllComments,
};