// routes/admin.routes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { protect, adminOnly } = require("../middleware/auth.middleware");

// Import controllers (we'll use existing ones where possible)
const userController = require("../controllers/user.controller");
const recipeController = require("../controllers/recipes.controller");
const commentController = require("../controllers/comments.controller");

// Apply protection + admin check to **ALL** routes in this file
router.use(protect);
router.use(adminOnly);

// ======================
// ADMIN DASHBOARD & STATS
// ======================
router.get("/dashboard", async (req, res) => {
    try {
        const User = require('../models/user.model');
        const Recipe = require('../models/recipes.models');
        const Comment = require('../models/comments.models');

        const [totalUsers, totalRecipes, totalComments] = await Promise.all([
            User.countDocuments(),
            Recipe.countDocuments(),
            Comment.countDocuments(),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalRecipes,
                totalComments,
                // Add more stats later (active users, pending recipes, etc.)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/analytics", async (req, res) => {
    try {
        const User = require("../models/user.model");
        const Recipe = require("../models/recipes.models");
        const Comment = require("../models/comments.models");
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const monthKeys = Array.from({ length: 6 }, (_, idx) => {
            const date = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const label = date.toLocaleString("en-US", { month: "short" });
            return { key, label };
        });

        const [
            totalUsers,
            totalRecipes,
            totalReviews,
            publishedRecipes,
            categories,
            avgRecipeRatingAgg,
            totalSavedAgg,
            totalViewAgg,
            monthlyRecipeAgg,
            monthlyUserAgg,
            monthlyReviewAgg,
            roleDistributionAgg,
        ] = await Promise.all([
            User.countDocuments(),
            Recipe.countDocuments(),
            Comment.countDocuments({ rating: { $ne: null }, parentComment: null, isDeleted: false }),
            Recipe.countDocuments({ status: "published" }),
            Recipe.distinct("category"),
            Recipe.aggregate([
                { $match: { averageRating: { $gt: 0 } } },
                { $group: { _id: null, avgRating: { $avg: "$averageRating" } } },
            ]),
            Recipe.aggregate([{ $group: { _id: null, totalSaved: { $sum: "$savedCount" } } }]),
            Recipe.aggregate([{ $group: { _id: null, totalViews: { $sum: "$viewCount" } } }]),
            Recipe.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            User.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            Comment.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sixMonthsAgo },
                        rating: { $ne: null },
                        parentComment: null,
                        isDeleted: false,
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            User.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } },
            ]),
        ]);

        const monthlyMapFromAgg = (rows) => {
            const map = new Map();
            rows.forEach((row) => {
                const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
                map.set(key, row.count);
            });
            return map;
        };

        const recipeMonthlyMap = monthlyMapFromAgg(monthlyRecipeAgg);
        const userMonthlyMap = monthlyMapFromAgg(monthlyUserAgg);
        const reviewMonthlyMap = monthlyMapFromAgg(monthlyReviewAgg);

        const monthlyGrowth = monthKeys.map(({ key, label }) => ({
            label,
            recipes: recipeMonthlyMap.get(key) || 0,
            users: userMonthlyMap.get(key) || 0,
            reviews: reviewMonthlyMap.get(key) || 0,
        }));

        const avgRecipeRating = avgRecipeRatingAgg[0]?.avgRating || 0;
        const totalSaved = totalSavedAgg[0]?.totalSaved || 0;
        const totalViews = totalViewAgg[0]?.totalViews || 0;
        const publishedRate = totalRecipes > 0 ? (publishedRecipes / totalRecipes) * 100 : 0;
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const currentMonthSignups = userMonthlyMap.get(currentMonthKey) || 0;
        const currentMonthRecipes = recipeMonthlyMap.get(currentMonthKey) || 0;
        const roleCounts = roleDistributionAgg.reduce((acc, item) => {
            acc[item._id || "unknown"] = item.count;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            data: {
                title: "Chef Portal",
                subtitle: "Analytics",
                description: "Live analytics from database records",
                adminName: req.user?.name || "Admin",
                adminEmail: req.user?.email || "",
                month: now.toLocaleString("en-US", { month: "short" }),
                monthlyGrowth,
                metrics: [
                    { id: "recipes", value: String(totalRecipes), label: "Recipes" },
                    { id: "categories", value: String((categories || []).length), label: "Categories" },
                    { id: "users", value: String(totalUsers), label: "Users" },
                ],
                insights: [
                    {
                        id: "rating",
                        value: avgRecipeRating.toFixed(1),
                        label: "Avg. Recipe Rating",
                        note: `${totalReviews} rated reviews`,
                    },
                    {
                        id: "published",
                        value: `${Math.round(publishedRate)}%`,
                        label: "Published Recipes",
                        note: `${publishedRecipes} of ${totalRecipes} published`,
                    },
                    {
                        id: "signups",
                        value: String(currentMonthSignups),
                        label: "New Users This Month",
                        note: "Based on account creation date",
                    },
                    {
                        id: "newRecipes",
                        value: String(currentMonthRecipes),
                        label: "New Recipes This Month",
                        note: "Based on recipe creation date",
                    },
                ],
                engagement: {
                    max: Math.max(totalSaved, totalViews, totalReviews, 10),
                    ticks: undefined,
                    series: [
                        { label: "Recipe Saves", value: totalSaved },
                        { label: "Recipe Views", value: totalViews },
                        { label: "Reviews Posted", value: totalReviews },
                    ],
                },
                distribution: [
                    { label: "Customers", value: `${roleCounts.customer || 0}` },
                    { label: "Users", value: `${roleCounts.user || 0}` },
                    { label: "Chefs", value: `${roleCounts.chief || 0}` },
                    { label: "Admins", value: `${roleCounts.admin || 0}` },
                ],
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ======================
// USER MANAGEMENT
// ======================
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.delete("/users/:id", userController.deactivateUser);
// router.put("/users/:id/role", userController.changeUserRole); // if needed later

// ======================
// RECIPE MANAGEMENT (Admin)
// ======================
router.get("/recipes", recipeController.getAllRecipesAdmin);
router.patch("/recipes/:id/feature", recipeController.toggleFeatured);
router.patch("/recipes/:id/status", recipeController.changeRecipeStatus);
// router.delete("/recipes/:id", recipeController.adminDeleteRecipe); // if you want force delete

// ======================
// COMMENT MANAGEMENT (Admin)
// ======================
router.get("/comments", commentController.getAllComments);
router.delete("/comments/:commentId/admin", commentController.deleteComment); // already exists

module.exports = router;