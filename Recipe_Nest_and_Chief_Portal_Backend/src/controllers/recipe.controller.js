/**
 * Recipe Controller
 *
 * Handles HTTP request/response cycle.
 * Delegates all business logic to recipeService.
 */

const recipeService = require("../services/recipes.services");
const Recipe = require("../models/recipes.models");

const sendSuccess = (res, statusCode, message, data = {}) => {
    res.status(statusCode).json({ success: true, message, ...data });
};

const handleError = (res, error) => {
    const status = error.statusCode || 500;
    const message = error.message || "Internal server error";
    res.status(status).json({ success: false, message });
};

const createRecipe = async (req, res) => {
    console.log("Create recipe request body here:", req.body);
    try {
        const recipeData = { ...req.body };

        const jsonFields = [
            "ingredients",
            "steps",
            "dietType",
            "tags",
            "tips",
            "equipment",
            "nutrition",
        ];
        jsonFields.forEach((field) => {
            if (recipeData[field] && typeof recipeData[field] === "string") {
                try {
                    recipeData[field] = JSON.parse(recipeData[field]);
                } catch (_) {}
            }
        });

        const recipe = await recipeService.createRecipe(
            recipeData,
            req.user._id,
            req.user.role,
            req.files
        );

        sendSuccess(res, 201, "Recipe created successfully", { recipe });
    } catch (error) {
        handleError(res, error);
    }
};

const getAllRecipes = async (req, res) => {
    try {
        const result = await recipeService.getAllRecipes(req.query);
        sendSuccess(res, 200, "Recipes fetched successfully", result);
    } catch (error) {
        handleError(res, error);
    }
};

const getAllRecipesAdmin = async (req, res) => {
    try {
        const result = await recipeService.getAllRecipesAdmin(req.query);
        sendSuccess(res, 200, "Admin recipes fetched successfully", result);
    } catch (error) {
        handleError(res, error);
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await Recipe.distinct("category");
        res.json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getFeaturedRecipes = async (req, res) => {
    try {
        const { limit } = req.query;
        const recipes = await recipeService.getFeaturedRecipes(limit);
        sendSuccess(res, 200, "Featured recipes fetched", { recipes });
    } catch (error) {
        handleError(res, error);
    }
};

const getSavedRecipes = async (req, res, next) => {
    try {
        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Please login.",
            });
        }

        const recipes = await recipeService.getSavedRecipes(userId);

        res.status(200).json({
            success: true,
            recipes,
            count: recipes.length,
        });
    } catch (error) {
        console.error("Get saved recipes error:", error);
        next(error);
    }
};

const getMyRecipes = async (req, res) => {
    try {
        const result = await recipeService.getRecipesByAuthor(
            req.user._id,
            req.query
        );
        sendSuccess(res, 200, "Your recipes fetched", result);
    } catch (error) {
        handleError(res, error);
    }
};

const getRecipesByUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const [publishedResult, totalRecipesMade] = await Promise.all([
            recipeService.getRecipesByAuthor(userId, { ...req.query, status: "published" }),
            Recipe.countDocuments({ author: userId }),
        ]);

        sendSuccess(res, 200, "User recipes fetched", {
            ...publishedResult,
            totalRecipesMade,
        });
    } catch (error) {
        handleError(res, error);
    }
};

const getRecipeById = async (req, res) => {
    try {
        const recipe = await recipeService.getRecipeById(req.params.id);
        sendSuccess(res, 200, "Recipe fetched successfully", { recipe });
    } catch (error) {
        handleError(res, error);
    }
};

const updateRecipe = async (req, res) => {
    try {
        const updateData = { ...req.body };

        const jsonFields = [
            "ingredients",
            "steps",
            "dietType",
            "tags",
            "tips",
            "equipment",
            "nutrition",
        ];
        jsonFields.forEach((field) => {
            if (updateData[field] && typeof updateData[field] === "string") {
                try {
                    updateData[field] = JSON.parse(updateData[field]);
                } catch (_) {}
            }
        });

        const recipe = await recipeService.updateRecipe(
            req.params.id,
            req.user._id,
            req.user.role,
            updateData,
            req.files
        );

        sendSuccess(res, 200, "Recipe updated successfully", { recipe });
    } catch (error) {
        handleError(res, error);
    }
};

const deleteRecipe = async (req, res) => {
    try {
        await recipeService.deleteRecipe(
            req.params.id,
            req.user._id,
            req.user.role
        );
        sendSuccess(res, 200, "Recipe deleted successfully");
    } catch (error) {
        handleError(res, error);
    }
};

const toggleSaveRecipe = async (req, res, next) => {
    try {
        const { id: recipeId } = req.params;
        const userId = req.user._id || req.user.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const result = await recipeService.toggleSaveRecipe(recipeId, userId);

        res.status(200).json({
            success: true,
            ...result,
            message: result.saved
                ? "Recipe saved successfully"
                : "Recipe removed from saved",
        });
    } catch (error) {
        next(error);
    }
};

const changeRecipeStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const recipe = await recipeService.changeRecipeStatus(
            req.params.id,
            req.user._id,
            status,
            req.user.role
        );
        sendSuccess(res, 200, `Recipe status changed to "${status}"`, { recipe });
    } catch (error) {
        handleError(res, error);
    }
};

const toggleFeatured = async (req, res) => {
    try {
        const recipe = await recipeService.toggleFeatured(req.params.id);
        const message = recipe.isFeatured
            ? "Recipe marked as featured"
            : "Recipe removed from featured";
        sendSuccess(res, 200, message, { recipe });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    createRecipe,
    getAllRecipes,
    getAllRecipesAdmin,
    getCategories,
    getFeaturedRecipes,
    getSavedRecipes,
    getMyRecipes,
    getRecipesByUser,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    toggleSaveRecipe,
    changeRecipeStatus,
    toggleFeatured,
};