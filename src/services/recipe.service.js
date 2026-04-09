const { recipes } = require("../models/recipe.model"); // ✅ destructure

const getAllRecipes = () => {
  return recipes;
};

const getRecipeById = (id) => {
  return recipes.find((recipe) => recipe.id === parseInt(id));
};

const createRecipe = (newRecipe) => {  // ✅ renamed parameter
  recipes.push(newRecipe);
  return newRecipe;
};

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
};