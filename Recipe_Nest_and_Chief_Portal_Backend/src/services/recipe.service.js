/**
 * Recipe Services
 *
 * Contains all business logic for recipe operations.
 * Controllers call these methods — keeping concerns separated.
 */

const Recipe = require("../models/recipes.models");
const mongoose = require("mongoose");
const { getFileUrl } = require("../config/multer");

const ensureRecipeManager = (userRole, action = "perform this action") => {
    const isManager = userRole === "admin" || userRole === "chief";
    if (!isManager) {
        const error = new Error(`Only chief/admin can ${action}`);
        error.statusCode = 403;
        throw error;
    }
};

// ═════════════════════════════════════════════
// CREATE
// ═════════════════════════════════════════════

const createRecipe = async (recipeData, authorId, authorRole, files = {}) => {
    ensureRecipeManager(authorRole, "create recipes");

    if (files.thumbnail && files.thumbnail[0]) {
        recipeData.thumbnail = getFileUrl(files.thumbnail[0].filename, "postImages");
    }
    if (files.images && files.images.length > 0) {
        recipeData.images = files.images.map((file) => getFileUrl(file.filename, "postImages"));
    }
    const recipe = await Recipe.create({ ...recipeData, author: authorId });
    return recipe;
};

// ═════════════════════════════════════════════
// READ — ALL / PAGINATED
// ═════════════════════════════════════════════

const getAllRecipes = async (queryParams = {}) => {
    const {
        page = 1,
        limit = 12,
        category,
        cuisine,
        difficulty,
        dietType,
        search,
        sort = "-createdAt",
        isFeatured,
    } = queryParams;

    const filter = { status: "published", isPublic: true };

    if (category) filter.category = category;
    if (cuisine) filter.cuisine = new RegExp(cuisine, "i");
    if (difficulty) filter.difficulty = difficulty;
    if (isFeatured === "true") filter.isFeatured = true;

    if (dietType) {
        const types = dietType.split(",").map((t) => t.trim());
        filter.dietType = { $all: types };
    }

    if (search) {
        filter.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [recipes, totalCount] = await Promise.all([
        Recipe.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .populate("author", "name avatar")
            .select("-savedBy -__v"),
        Recipe.countDocuments(filter),
    ]);

    return {
        recipes,
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: Number(page),
    };
};

const getAllRecipesAdmin = async (queryParams = {}) => {
    const {
        page = 1,
        limit = 200,
        authorId,
        category,
        difficulty,
        status,
        search,
        sort = "-createdAt",
    } = queryParams;

    const filter = {};

    if (authorId) filter.author = authorId;
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;

    if (search) {
        filter.$or = [
            { title: new RegExp(search, "i") },
            { description: new RegExp(search, "i") },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [recipes, totalCount] = await Promise.all([
        Recipe.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .populate("author", "name email avatar role")
            .select("-savedBy -__v"),
        Recipe.countDocuments(filter),
    ]);

    return {
        recipes,
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: Number(page),
    };
};

// ═════════════════════════════════════════════
// READ — SINGLE
// ═════════════════════════════════════════════

const getRecipeById = async (recipeId) => {
    const recipe = await Recipe.findByIdAndUpdate(
        recipeId,
        { $inc: { viewCount: 1 } },
        { new: true }
    )
        .populate("author", "name avatar bio")
        .select("-savedBy -__v");

    if (!recipe) {
        const error = new Error("Recipe not found");
        error.statusCode = 404;
        throw error;
    }

    return recipe;
};

// ═════════════════════════════════════════════
// READ — BY AUTHOR
// ═════════════════════════════════════════════

const getRecipesByAuthor = async (authorId, queryParams = {}) => {
    const { page = 1, limit = 12, status } = queryParams;
    const filter = { author: authorId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [recipes, totalCount] = await Promise.all([
        Recipe.find(filter)
            .sort("-createdAt")
            .skip(skip)
            .limit(Number(limit))
            .select("-savedBy -__v"),
        Recipe.countDocuments(filter),
    ]);

    return {
        recipes,
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: Number(page),
    };
};

// ═════════════════════════════════════════════
// UPDATE
// ═════════════════════════════════════════════

const updateRecipe = async (recipeId, authorId, userRole, updateData, files = {}) => {
    ensureRecipeManager(userRole, "edit recipes");

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
        const error = new Error("Recipe not found");
        error.statusCode = 404;
        throw error;
    }

    if (files.thumbnail && files.thumbnail[0]) {
        updateData.thumbnail = getFileUrl(files.thumbnail[0].filename, "postImages");
    }

    if (files.images && files.images.length > 0) {
        const newImagePaths = files.images.map((f) => getFileUrl(f.filename, "postImages"));
        updateData.images = [...(recipe.images || []), ...newImagePaths];
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
        recipeId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-savedBy -__v");

    return updatedRecipe;
};

// ═════════════════════════════════════════════
// DELETE
// ═════════════════════════════════════════════

const deleteRecipe = async (recipeId, authorId, userRole) => {
    ensureRecipeManager(userRole, "delete recipes");

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
        const error = new Error("Recipe not found");
        error.statusCode = 404;
        throw error;
    }

    await recipe.deleteOne();
};

// ═════════════════════════════════════════════
// SAVE / UNSAVE (BOOKMARK)
// ═════════════════════════════════════════════

const toggleSaveRecipe = async (recipeId, userId) => {
    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
        const error = new Error("Recipe not found");
        error.statusCode = 404;
        throw error;
    }

    const alreadySaved = recipe.savedBy.some(
        (id) => id.toString() === userId.toString()
    );

    let result;

    if (alreadySaved) {
        await Recipe.findByIdAndUpdate(recipeId, {
            $pull: { savedBy: userId },
            $inc: { savedCount: -1 },
        });
        result = {
            saved: false,
            savedCount: Math.max(0, (recipe.savedCount || 0) - 1)
        };
    } else {
        await Recipe.findByIdAndUpdate(recipeId, {
            $addToSet: { savedBy: userId },
            $inc: { savedCount: 1 },
        });
        result = {
            saved: true,
            savedCount: (recipe.savedCount || 0) + 1
        };
    }

    return result;
};

/**
 * Get all recipes saved/bookmarked by a user.
 *
 * FIX: Removed `isPublic: true` filter — a user can save any recipe
 * they have access to, so we should return all of them regardless of
 * visibility. Also uses mongoose.Types.ObjectId cast to ensure the
 * userId type always matches what's stored in savedBy.
 */
const getSavedRecipes = async (userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());

    const recipes = await Recipe.find({ savedBy: userObjectId })
        .sort("-createdAt")
        .populate("author", "name avatar")
        .select("-savedBy -__v");

    return recipes;
};

// ═════════════════════════════════════════════
// FEATURED
// ═════════════════════════════════════════════

const getFeaturedRecipes = async (limit = 6) => {
    return Recipe.find({ isFeatured: true, status: "published", isPublic: true })
        .sort("-createdAt")
        .limit(Number(limit))
        .populate("author", "name avatar")
        .select("-savedBy -__v");
};

// ═════════════════════════════════════════════
// ADMIN — TOGGLE STATUS / FEATURE
// ═════════════════════════════════════════════

const toggleFeatured = async (recipeId) => {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
        const error = new Error("Recipe not found");
        error.statusCode = 404;
        throw error;
    }
    recipe.isFeatured = !recipe.isFeatured;
    await recipe.save();
    return recipe;
};

const changeRecipeStatus = async (recipeId, authorId, status, userRole) => {
    ensureRecipeManager(userRole, "change recipe status");

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
        const error = new Error("Recipe not found");
        error.statusCode = 404;
        throw error;
    }

    recipe.status = status;
    await recipe.save();
    return recipe;
};

module.exports = {
    createRecipe,
    getAllRecipes,
    getAllRecipesAdmin,
    getRecipeById,
    getRecipesByAuthor,
    updateRecipe,
    deleteRecipe,
    toggleSaveRecipe,
    getSavedRecipes,
    getFeaturedRecipes,
    toggleFeatured,
    changeRecipeStatus,
};