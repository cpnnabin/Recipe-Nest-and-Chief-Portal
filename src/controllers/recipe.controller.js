const recipeService = require("../services/recipe.service");

const getAllRecipes = (req, res) => {
  const recipes = recipeService.getAllRecipes();
  res.json(recipes);
};

const getRecipeById = (req, res) => {
  const recipe = recipeService.getRecipeById(req.params.id);      

  if (!recipe) {
    return res.status(404).json({ message: "Recipe not found" });
  } 
    res.json(recipe);
};

const createRecipe = (req, res) => {
  const newRecipe = recipeService.createRecipe(req.body);
  res.status(201).json(newRecipe);
};

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
};