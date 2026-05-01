/**
 * Comment Routes
 *
 * All routes are prefixed with /api/comments (set in app.js).
 *
 * Route overview:
 *  PUBLIC
 *    GET  /api/comments/recipe/:recipeId          → all comments for a recipe
 *    GET  /api/comments/:commentId/replies        → all replies for a comment
 *    GET  /api/comments/user/:userId              → comments by a specific user
 *    GET  /api/comments/:commentId                → single comment
 *
 *  PRIVATE  (JWT required)
 *    POST   /api/comments/recipe/:recipeId        → add comment / reply
 *    GET    /api/comments/my-comments             → logged-in user's comments
 *    PUT    /api/comments/:commentId              → edit own comment
 *    DELETE /api/comments/:commentId              → delete own comment
 *    POST   /api/comments/:commentId/like         → toggle like
 *
 *  ADMIN  (admin role required)
 *    GET  /api/comments                           → all comments (dashboard)
 *    DELETE /api/comments/:commentId/admin        → force-delete any comment
 */

const express = require("express");
const router = express.Router();

// ── Auth & role middleware ─────────────────────────────────────────────────
// protect   → verifies JWT and attaches req.user
// adminOnly → allows only users with role === "admin"
const { protect, adminOnly } = require("../middleware/auth.middleware");

// ── Controller ────────────────────────────────────────────────────────────
const commentController = require("../controllers/comments.controller");

// ═════════════════════════════════════════════
// PUBLIC ROUTES  (no auth required)
// ═════════════════════════════════════════════

// GET  /api/comments/recipe/:recipeId
// → paginated top-level comments for a recipe (inline replies included)
router.get("/recipe/:recipeId", commentController.getCommentsByRecipe);

// GET  /api/comments/user/:userId
// → all comments written by a specific user (public profile)
router.get("/user/:userId", commentController.getCommentsByUser);

// GET  /api/comments/:commentId/replies
// → paginated replies for a specific comment
router.get("/:commentId/replies", commentController.getRepliesByComment);

// GET  /api/comments/:commentId
// → single comment with its replies
router.get("/:commentId", commentController.getCommentById);

// ═════════════════════════════════════════════
// PRIVATE ROUTES  (JWT required)
// ═════════════════════════════════════════════

// POST  /api/comments/recipe/:recipeId
// → create a new comment or reply on a recipe
// Body: { content, rating? (1-5, top-level only), parentComment? (ObjectId) }
router.post("/recipe/:recipeId", protect, commentController.createComment);

// GET  /api/comments/my-comments
// → fetch the logged-in user's own comments
// NOTE: must be defined before /:commentId to avoid param collision
router.get("/my-comments", protect, commentController.getMyComments);

// PUT  /api/comments/:commentId
// → edit own comment (content and/or rating)
// Body: { content?, rating? }
router.patch("/:commentId", protect, commentController.updateComment);

// DELETE /api/comments/:commentId
// → soft-delete own comment (also soft-deletes its replies)
router.delete("/:commentId", protect, commentController.deleteComment);

// POST  /api/comments/:commentId/like
// → toggle like / unlike on a comment
router.post("/:commentId/like", protect, commentController.toggleLikeComment);

// ═════════════════════════════════════════════
// ADMIN ROUTES  (admin role required)
// ═════════════════════════════════════════════

// GET  /api/comments
// → list all comments across the platform (admin dashboard)
// Query params: page, limit, recipeId, authorId
router.get("/", protect, adminOnly, commentController.getAllComments);

// DELETE /api/comments/:commentId/admin
// → admin force-delete any comment regardless of ownership
router.delete("/:commentId/admin", protect, adminOnly, commentController.deleteComment);

module.exports = router;