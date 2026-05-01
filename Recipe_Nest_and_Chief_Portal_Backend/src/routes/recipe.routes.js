/**
 * Recipe Routes
 *
 * All routes are prefixed with /api/recipes (set in app.js).
 * Multer is imported from the shared config so storage settings
 * (disk vs cloud, file-size limits, allowed types) stay in one place.
 *
 * ⚠️  IMPORTANT — route ordering rules in Express:
 *     Specific static paths (/featured, /saved, /my-recipes) MUST be
 *     declared BEFORE wildcard params (/:id), otherwise Express will
 *     treat the static segment as the param value and call the wrong handler.
 */

const express = require("express");
const router = express.Router();

const { recipeImagesUpload } = require("../config/multer");
const recipeController = require("../controllers/recipes.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

const recipeUpload = recipeImagesUpload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images",    maxCount: 5 },
]);

// ═════════════════════════════════════════════
// PUBLIC ROUTES  (no auth required)
// ═════════════════════════════════════════════

// GET  /api/recipes
router.get("/", recipeController.getAllRecipes);

// GET  /api/recipes/featured
router.get("/featured", recipeController.getFeaturedRecipes);

// GET  /api/recipes/user/:userId
router.get("/user/:userId", recipeController.getRecipesByUser);

// GET  /api/recipes/categories  ← add this before /:id
router.get("/categories", recipeController.getCategories);

// ═════════════════════════════════════════════
// PRIVATE ROUTES — static paths first, THEN /:id
// ═════════════════════════════════════════════

// GET  /api/recipes/saved  ← MUST be before /:id
router.get("/saved", protect, recipeController.getSavedRecipes);

// GET  /api/recipes/my-recipes  ← MUST be before /:id
router.get("/my-recipes", protect, recipeController.getMyRecipes);

// GET  /api/recipes/:id  ← wildcard, comes last among GETs
router.get("/:id", recipeController.getRecipeById);


// ═════════════════════════════════════════════
// OTHER PRIVATE ROUTES
// ═════════════════════════════════════════════

// POST   /api/recipes
router.post("/", protect, adminOnly, recipeUpload, recipeController.createRecipe);

// PUT    /api/recipes/:id
router.put("/:id", protect, adminOnly, recipeUpload, recipeController.updateRecipe);

// DELETE /api/recipes/:id
router.delete("/:id", protect, adminOnly, recipeController.deleteRecipe);

// POST   /api/recipes/:id/save  (toggle save/unsave)
router.post("/:id/save", protect, recipeController.toggleSaveRecipe);

// PATCH  /api/recipes/:id/status
router.patch("/:id/status", protect, adminOnly, recipeController.changeRecipeStatus);

// ═════════════════════════════════════════════
// ADMIN ROUTES
// ═════════════════════════════════════════════

// PATCH  /api/recipes/:id/feature
router.patch("/:id/feature", protect, adminOnly, recipeController.toggleFeatured);

module.exports = router;