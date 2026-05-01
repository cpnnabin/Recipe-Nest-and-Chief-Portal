/**
 * Comment Model
 *
 * Represents a comment (and optional star rating) left by a user on a recipe.
 * Supports one level of nested replies via `parentComment`.
 * When a top-level comment carries a rating, the Recipe's averageRating
 * and totalReviews fields are updated by the comment service.
 */

const mongoose = require("mongoose");

// ═════════════════════════════════════════════
// MAIN COMMENT SCHEMA
// ═════════════════════════════════════════════
const CommentSchema = new mongoose.Schema(
    {
        // ── CONTENT ─────────────────────────────
        content: {
            type: String,
            required: [true, "Comment content is required"],
            trim: true,
            minlength: [2, "Comment must be at least 2 characters"],
            maxlength: [1000, "Comment cannot exceed 1000 characters"],
        },

        // ── AUTHOR (Reference to User) ──────────
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Comment author is required"],
        },

        // ── RECIPE (Reference to Recipe) ────────
        recipe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Recipe",
            required: [true, "Recipe reference is required"],
        },

        // ── RATING (optional, 1-5 stars) ────────
        // Only allowed on top-level comments (not replies).
        // One rating per user per recipe is enforced in the service layer.
        rating: {
            type: Number,
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
            default: null,
        },

        // ── NESTED REPLY SUPPORT ─────────────────
        // If set, this comment is a reply to another comment.
        // Only one level of nesting is supported.
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
        },

        // ── LIKES ───────────────────────────────
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        likeCount: {
            type: Number,
            default: 0,
        },

        // ── EDIT FLAG ───────────────────────────
        isEdited: {
            type: Boolean,
            default: false,
        },

        // ── SOFT DELETE / MODERATION ────────────
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // createdAt + updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ═════════════════════════════════════════════
// INDEXES
// ═════════════════════════════════════════════

// Most common query: all comments for a recipe, newest first
CommentSchema.index({ recipe: 1, createdAt: -1 });

// Fetch all comments by a specific user
CommentSchema.index({ author: 1 });

// Fetch all replies to a comment
CommentSchema.index({ parentComment: 1 });

// ═════════════════════════════════════════════
// VIRTUALS
// ═════════════════════════════════════════════

// Expose whether this comment has replies (populated separately)
CommentSchema.virtual("replies", {
    ref: "Comment",
    localField: "_id",
    foreignField: "parentComment",
});

// True if this is a top-level comment
CommentSchema.virtual("isTopLevel").get(function () {
    return this.parentComment === null;
});

// ═════════════════════════════════════════════
// INSTANCE METHODS
// ═════════════════════════════════════════════

// Check if a specific user has liked this comment
CommentSchema.methods.isLikedByUser = function (userId) {
    return this.likes.some((id) => id.toString() === userId.toString());
};

// ═════════════════════════════════════════════
// STATIC METHODS
// ═════════════════════════════════════════════

// Get all visible (non-deleted) top-level comments for a recipe
CommentSchema.statics.findByRecipe = function (recipeId) {
    return this.find({
        recipe: recipeId,
        parentComment: null,
        isDeleted: false,
    });
};

// Get all replies to a specific comment
CommentSchema.statics.findReplies = function (commentId) {
    return this.find({
        parentComment: commentId,
        isDeleted: false,
    });
};

// Check if a user has already rated a recipe (via a rated comment)
CommentSchema.statics.hasUserRated = function (recipeId, userId) {
    return this.findOne({
        recipe: recipeId,
        author: userId,
        rating: { $ne: null },
        parentComment: null,
        isDeleted: false,
    });
};

const Comment = mongoose.model("Comment", CommentSchema);

module.exports = Comment;