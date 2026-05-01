const connectDB = require("../src/config/database");
const { User, Recipe, Comment } = require("../src/models");
const {
  AUTH_USERS_SEED,
  seedCategories,
  seedRecipes,
  seedReviews,
  seedBookmarks,
} = require("../src/data/demo.seed");

const resetCollections = async () => {
  await Promise.all([
    Comment.deleteMany({}),
    Recipe.deleteMany({}),
    User.deleteMany({}),
  ]);
};

const buildSteps = (instructions = []) =>
  instructions.map((instruction, index) => ({
    stepNumber: index + 1,
    instruction,
  }));

const seed = async () => {
  try {
    const reset = process.argv.includes("--reset");
    await connectDB();

    const seedUser = AUTH_USERS_SEED[0];
    const existingUser = await User.findOne({ email: seedUser.email }).lean();

    if (existingUser && !reset) {
      console.log("Seed data already exists. Run again with --reset to rebuild it.");
      process.exit(0);
    }

    if (reset) {
      await resetCollections();
    }

    const users = await Promise.all(
      AUTH_USERS_SEED.map((entry, index) =>
        User.create({
          name: entry.fullName,
          email: entry.email,
          password: entry.password,
          role: entry.role,
          phone: `98000000${String(index + 1).padStart(2, "0")}`,
          address: "Kathmandu, Nepal",
          isActive: true,
        })
      )
    );

    const userMap = new Map(users.map((user) => [user.email, user]));

    const recipes = await Promise.all(
      seedRecipes.map((recipe) =>
        Recipe.create({
          title: recipe.title,
          description: recipe.description,
          thumbnail: recipe.image,
          images: [recipe.image],
          ingredients: recipe.ingredients,
          steps: buildSteps(recipe.instructions),
          prepTime: recipe.prep_time,
          cookTime: recipe.cook_time,
          servings: recipe.servings,
          difficulty: recipe.difficulty_level,
          nutrition: { calories: recipe.calories },
          category: recipe.categoryName,
          cuisine: recipe.cuisine,
          dietType: recipe.dietType,
          tags: recipe.tags,
          tips: recipe.tips,
          equipment: recipe.equipment,
          status: "published",
          viewCount: recipe.view_count || 0,
          averageRating: recipe.average_rating || 0,
          totalReviews: 0,
          isFeatured: Boolean(recipe.isFeatured),
          isPublic: true,
          author: users[0]._id,
        })
      )
    );

    const recipeMap = new Map(recipes.map((recipe) => [recipe.title, recipe]));

    for (const review of seedReviews) {
      const recipe = recipeMap.get(review.recipeTitle);
      const user = userMap.get(review.authorEmail);
      if (!recipe || !user) continue;

      await Comment.create({
        content: review.comment,
        rating: review.rating,
        author: user._id,
        recipe: recipe._id,
      });
    }

    for (const recipe of recipes) {
      const ratings = await Comment.find({
        recipe: recipe._id,
        rating: { $ne: null },
        parentComment: null,
        isDeleted: false,
      }).select("rating");

      const totalReviews = ratings.length;
      const averageRating = totalReviews
        ? Math.round((ratings.reduce((sum, row) => sum + Number(row.rating), 0) / totalReviews) * 10) / 10
        : 0;

      await Recipe.findByIdAndUpdate(recipe._id, { averageRating, totalReviews });
    }

    const bookmarks = seedBookmarks.length > 0 ? seedBookmarks : recipes.slice(0, 3).map((recipe) => ({
      recipeTitle: recipe.title,
      authorEmail: seedUser.email,
    }));

    for (const bookmark of bookmarks) {
      const recipe = recipeMap.get(bookmark.recipeTitle);
      const user = userMap.get(bookmark.authorEmail);
      if (!recipe || !user) continue;

      if (!recipe.savedBy.some((id) => id.toString() === user._id.toString())) {
        recipe.savedBy.push(user._id);
        recipe.savedCount = recipe.savedBy.length;
        await recipe.save();
      }
    }

    console.log("Seed completed successfully");
    console.log({
      users: users.length,
      categories: seedCategories.length,
      recipes: recipes.length,
      comments: await Comment.countDocuments(),
      bookmarks: recipes.reduce((sum, recipe) => sum + (recipe.savedBy?.length || 0), 0),
    });

    AUTH_USERS_SEED.forEach((user) =>
      console.log(`- ${user.email} / ${user.password} (${user.role})`)
    );

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
};

seed();
