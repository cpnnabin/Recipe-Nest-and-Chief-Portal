const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipe.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", recipeController.getAllRecipes);
router.get("/:id", recipeController.getRecipeById);
router.post("/",authMiddleware, recipeController.createRecipe);

module.exports = router;