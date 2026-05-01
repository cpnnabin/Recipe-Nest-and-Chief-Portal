/**
 * Recipe Model
 *
 * This model defines the structure of a Recipe in the database.
 * A recipe represents a cooking guide that users can view, save, and rate.
 */

const mongoose = require("mongoose");

// ─────────────────────────────────────────────
// Sub-schema for Ingredients
// ─────────────────────────────────────────────
const IngredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Ingredient name is required"],
        trim: true,
        maxlength: [100, "Ingredient name cannot exceed 100 characters"],
    },
    quantity: {
        type: String, // "2", "1/2", "3-4" (string to handle fractions)
        required: [true, "Quantity is required"],
        trim: true,
    },
    unit: {
        type: String, // "cups", "tbsp", "grams", "pieces", etc.
        trim: true,
        default: "",
    },
    isOptional: {
        type: Boolean,
        default: false,
    },
});

// ─────────────────────────────────────────────
// Sub-schema for Cooking Steps/Instructions
// ─────────────────────────────────────────────
const StepSchema = new mongoose.Schema({
    stepNumber: {
        type: Number,
        required: [true, "Step number is required"],
    },
    instruction: {
        type: String,
        required: [true, "Step instruction is required"],
        trim: true,
        maxlength: [1000, "Instruction cannot exceed 1000 characters"],
    },
    image: {
        type: String,   // URL for step-by-step photo
        default: null,
    },
    duration: {
        type: Number,   // Time for this step in minutes
        default: null,
    },
});

// ─────────────────────────────────────────────
// Sub-schema for Nutrition Information
// ─────────────────────────────────────────────
const NutritionSchema = new mongoose.Schema({
    calories: { type: Number, default: null },
    protein: { type: Number, default: null },    // in grams
    carbs: { type: Number, default: null },      // in grams
    fat: { type: Number, default: null },        // in grams
    fiber: { type: Number, default: null },      // in grams
    sugar: { type: Number, default: null },      // in grams
    sodium: { type: Number, default: null },     // in mg
});

// ═════════════════════════════════════════════
// MAIN RECIPE SCHEMA
// ═════════════════════════════════════════════
const RecipeSchema = new mongoose.Schema(
    {
        // ── BASIC INFO ──────────────────────────
        title: {
            type: String,
            required: [true, "Please provide a recipe title"],
            trim: true,
            maxlength: [150, "Title cannot exceed 150 characters"],
        },

        description: {
            type: String,
            required: [true, "Please provide a recipe description"],
            trim: true,
            maxlength: [2000, "Description cannot exceed 2000 characters"],
        },

        shortDescription: {
            type: String,
            trim: true,
            maxlength: [200, "Short description cannot exceed 200 characters"],
        },

        // ── AUTHOR (Reference to User) ─────────
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Please provide the recipe author"],
        },

        // ── IMAGES ──────────────────────────────
        // Main image shown in cards/listings
        thumbnail: {
            type: String,
            default: null,
        },

        // Multiple recipe images (gallery)
        images: [
            {
                type: String, // Array of image URLs
            },
        ],
        // ── CATEGORIZATION ──────────────────────
        category: {
            type: String,
            required: [true, "Please provide a category"],
            enum: [
                "breakfast",
                "lunch",
                "dinner",
                "appetizer",
                "snack",
                "dessert",
                "beverage",
                "soup",
                "salad",
                "side-dish",
                "sauce",
                "other",
            ],
            trim: true,
        },

        cuisine: {
            type: String, // "Italian", "Indian", "Mexican", "Chinese", etc.
            trim: true,
            default: null,
        },

        // ── DIETARY INFO ────────────────────────
        dietType: [
            {
                type: String,
                enum: [
                    "vegetarian",
                    "vegan",
                    "gluten-free",
                    "dairy-free",
                    "nut-free",
                    "keto",
                    "paleo",
                    "low-carb",
                    "sugar-free",
                    "halal",
                    "kosher",
                ],
            },
        ],

        // ── DIFFICULTY ──────────────────────────
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "easy",
        },

        cookTime: {
            type: Number, // in minutes
            required: [true, "Please provide cook time"],
            min: [0, "Cook time cannot be negative"],
        },

        prepTime: {
            type: Number, // in minutes
            default: 0,
            min: [0, "Prep time cannot be negative"],
        },

        totalTime: {
            type: Number, // in minutes
            default: 0,
            min: [0, "Total time cannot be negative"],
        },

        // ── SERVINGS ────────────────────────────
        servings: {
            type: Number,
            required: [true, "Please provide number of servings"],
            min: [1, "Servings must be at least 1"],
            default: 1,
        },

        // ── INGREDIENTS ─────────────────────────
        ingredients: {
            type: [IngredientSchema],
            required: [true, "Please provide at least one ingredient"],
            validate: {
                validator: function (val) {
                    return val.length > 0;
                },
                message: "A recipe must have at least one ingredient",
            },
        },

        // ── COOKING STEPS ───────────────────────
        steps: {
            type: [StepSchema],
            required: [true, "Please provide cooking steps"],
            validate: {
                validator: function (val) {
                    return val.length > 0;
                },
                message: "A recipe must have at least one step",
            },
        },

        // ── NUTRITION ───────────────────────────
        nutrition: {
            type: NutritionSchema,
            default: null, // Per serving nutrition info
        },

        // ── TAGS ────────────────────────────────
        tags: [
            {
                type: String,
                trim: true,
            },
        ],

        // ── TIPS & NOTES ────────────────────────
        tips: [
            {
                type: String,
                trim: true,
                maxlength: [500, "Tip cannot exceed 500 characters"],
            },
        ],

        // ── EQUIPMENT NEEDED ────────────────────
        equipment: [
            {
                type: String,
                trim: true, // "Oven", "Blender", "Mixing Bowl"
            },
        ],

        // ── STATUS ──────────────────────────────
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft",
        },

        // ── RATINGS & REVIEWS ───────────────────
        averageRating: {
            type: Number,
            min: [0, "Rating cannot be less than 0"],
            max: [5, "Rating cannot be more than 5"],
            default: 0,
        },

        totalReviews: {
            type: Number,
            default: 0,
        },

        // ── ENGAGEMENT COUNTERS ─────────────────
        viewCount: {
            type: Number,
            default: 0,
        },

        savedCount: {
            type: Number, // How many users bookmarked/saved this
            default: 0,
        },

        // Users who saved/bookmarked this recipe
        savedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        // ── FLAGS ────────────────────────────────
        isFeatured: {
            type: Boolean,
            default: false,
        },

        isPublic: {
            type: Boolean,
            default: true, // false = private recipe
        },
    },
    {
        timestamps: true,  // createdAt + updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ═════════════════════════════════════════════
// INDEXES
// ═════════════════════════════════════════════

// Full-text search on title, description, tags
RecipeSchema.index({ title: "text", description: "text", tags: "text" });

// Filter by category + status
RecipeSchema.index({ category: 1, status: 1 });

// Filter by difficulty
RecipeSchema.index({ difficulty: 1 });

// Filter by cuisine
RecipeSchema.index({ cuisine: 1 });

// Filter by author
RecipeSchema.index({ author: 1 });

// ═════════════════════════════════════════════
// VIRTUALS
// ═════════════════════════════════════════════

// Get author info when populated
RecipeSchema.virtual("authorInfo", {
    ref: "User",
    localField: "author",
    foreignField: "_id",
    justOne: true,
});

// Formatted total time (e.g., "1h 30m")
RecipeSchema.virtual("formattedTotalTime").get(function () {
    const totalMinutes = Number(this.totalTime ?? (this.prepTime || 0) + (this.cookTime || 0));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
});

// ═════════════════════════════════════════════
// PRE-SAVE MIDDLEWARE
// ═════════════════════════════════════════════

RecipeSchema.pre("save", function () {
    // Auto-calculate total time
    this.totalTime = (this.prepTime || 0) + (this.cookTime || 0);

    // Auto-number steps if not already numbered
    if (this.steps && this.steps.length > 0) {
        this.steps.forEach((step, index) => {
            if (!step.stepNumber) {
                step.stepNumber = index + 1;
            }
        });
    }
});

// ═════════════════════════════════════════════
// INSTANCE METHODS
// ═════════════════════════════════════════════

// Check if recipe is saved by a specific user
RecipeSchema.methods.isSavedByUser = function (userId) {
    return this.savedBy.includes(userId);
};

// Get ingredient count
RecipeSchema.methods.getIngredientCount = function () {
    return this.ingredients ? this.ingredients.length : 0;
};

// ═════════════════════════════════════════════
// STATIC METHODS
// ═════════════════════════════════════════════

// Find only published recipes
RecipeSchema.statics.findPublished = function () {
    return this.find({ status: "published", isPublic: true });
};

// Find recipes by category
RecipeSchema.statics.findByCategory = function (category) {
    return this.find({ category, status: "published" });
};

// Find recipes by cuisine
RecipeSchema.statics.findByCuisine = function (cuisine) {
    return this.find({ cuisine, status: "published" });
};

const Recipe = mongoose.model("Recipe", RecipeSchema);

module.exports = Recipe;