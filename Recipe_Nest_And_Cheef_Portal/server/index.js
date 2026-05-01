import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const UPLOADS = path.join(ROOT, "uploads");
const AVATARS = path.join(UPLOADS, "avatars");
const RECIPE_IMAGES = path.join(UPLOADS, "recipes");

for (const dir of [UPLOADS, AVATARS, RECIPE_IMAGES]) {
  fs.mkdirSync(dir, { recursive: true });
}

const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/recipe_nest";
const JWT_SECRET = process.env.JWT_SECRET || "recipe-nest-dev-secret";
const CLIENT_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

const app = express();
app.use(cors({ origin: CLIENT_ORIGINS, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOADS));

const ingredientSchema = new mongoose.Schema(
  {
    name: String,
    quantity: String,
    unit: String,
    isOptional: { type: Boolean, default: false },
  },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  {
    stepNumber: Number,
    instruction: String,
    duration: Number,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    role: { type: String, enum: ["customer", "user", "admin"], default: "customer" },
    avatar: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    savedRecipes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
  },
  { timestamps: true }
);

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    category: { type: String, default: "other" },
    cuisine: { type: String, default: "" },
    difficulty: { type: String, default: "easy" },
    cookTime: { type: Number, default: 0 },
    servings: { type: Number, default: 1 },
    dietType: [String],
    tags: [String],
    tips: [String],
    equipment: [String],
    ingredients: [ingredientSchema],
    steps: [stepSchema],
    nutrition: mongoose.Schema.Types.Mixed,
    thumbnail: { type: String, default: "" },
    images: [{ type: String }],
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    isPublic: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    rating: { type: Number, default: null },
    likeCount: { type: Number, default: 0 },
    author: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      email: String,
      avatar: String,
    },
    recipe: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
      title: String,
    },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Recipe = mongoose.models.Recipe || mongoose.model("Recipe", recipeSchema);
const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const isAvatar = file.fieldname === "avatar" || file.fieldname === "profilePic";
      cb(null, isAvatar ? AVATARS : RECIPE_IMAGES);
    },
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
    },
  }),
});

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Missing auth token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).populate("savedRecipes");

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found with this token." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

const signToken = (user) =>
  jwt.sign(
    { id: String(user._id), role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

const publicPath = (value) => {
  if (!value) return "";
  const normalized = String(value).replace(/\\/g, "/");
  const idx = normalized.toLowerCase().indexOf("uploads/");
  return idx !== -1 ? normalized.substring(idx) : normalized.replace(/^\/+/, "");
};

const normalizeRecipe = (recipe) => {
  const plain = recipe.toObject ? recipe.toObject() : recipe;
  return {
    ...plain,
    thumbnail: publicPath(plain.thumbnail),
    images: Array.isArray(plain.images) ? plain.images.map(publicPath) : [],
  };
};

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "API running" });
});

app.post("/api/users/register", async (req, res) => {
  try {
    const { name, password, phone = "", address = "", role = "customer" } = req.body;
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!name || !email || !password || !phone || !address || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, phone, address, role });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select("+passwordHash");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    return res.json({
      success: true,
      message: "Login successful",
      name: user.name,
      role: user.role,
      jwtToken: signToken(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/users/profile", auth, async (req, res) => {
  return res.json({ success: true, data: { user: req.user } });
});

app.put("/api/users/profile", auth, async (req, res) => {
  try {
    const updates = {};
    ["name", "email", "phone", "address"].forEach((field) => {
      if (req.body[field] !== undefined && String(req.body[field]).trim() !== "") {
        updates[field] = field === "email" ? String(req.body[field]).toLowerCase() : req.body[field];
      }
    });

    if (updates.email && updates.email !== req.user.email) {
      const exists = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } });
      if (exists) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    return res.json({ success: true, data: { user: updated } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.patch("/api/users/avatar", auth, upload.fields([{ name: "avatar", maxCount: 1 }, { name: "profilePic", maxCount: 1 }]), async (req, res) => {
  try {
    const file = req.files?.avatar?.[0] || req.files?.profilePic?.[0];
    if (!file) {
      return res.status(400).json({ success: false, message: "Avatar file is required" });
    }

    const avatar = path.relative(ROOT, file.path).replace(/\\/g, "/");
    const updated = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });
    return res.json({ success: true, data: { user: updated } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/users/avatar", auth, async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.user._id, { avatar: "" }, { new: true });
  return res.json({ success: true, data: { user: updated } });
});

app.get("/api/users", auth, requireAdmin, async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  return res.json({ success: true, data: { users } });
});

app.delete("/api/users/:id", auth, requireAdmin, async (req, res) => {
  const result = await User.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ success: false, message: "User not found" });
  return res.json({ success: true, message: "User deleted" });
});

app.patch("/api/users/:id/status", auth, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  user.isActive = !user.isActive;
  await user.save();
  return res.json({ success: true, data: { user } });
});

app.get("/api/admin/dashboard", auth, requireAdmin, async (_req, res) => {
  const [totalRecipes, totalUsers, totalComments] = await Promise.all([
    Recipe.countDocuments(),
    User.countDocuments(),
    Comment.countDocuments(),
  ]);

  return res.json({
    success: true,
    data: { totalRecipes, totalUsers, totalComments },
  });
});

app.get("/api/recipes", auth, async (req, res) => {
  const recipes = await Recipe.find({}).populate("author", "name avatar role").sort({ createdAt: -1 });
  const list = recipes.map(normalizeRecipe);
  return res.json({ success: true, recipes: list, data: list });
});

app.get("/api/recipes/my-recipes", auth, async (req, res) => {
  const recipes = await Recipe.find({ author: req.user._id }).populate("author", "name avatar role").sort({ createdAt: -1 });
  return res.json({ success: true, recipes: recipes.map(normalizeRecipe) });
});

app.get("/api/recipes/saved", auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: "savedRecipes", populate: { path: "author", select: "name avatar role" } });
  return res.json({ success: true, recipes: (user?.savedRecipes || []).map(normalizeRecipe) });
});

app.get("/api/recipes/:id", auth, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).populate("author", "name avatar role");
  if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });
  return res.json({ success: true, recipe: normalizeRecipe(recipe) });
});

app.post("/api/recipes", auth, upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "images", maxCount: 5 }]), async (req, res) => {
  try {
    const files = req.files || {};
    const thumbnail = files.thumbnail?.[0] ? path.relative(ROOT, files.thumbnail[0].path).replace(/\\/g, "/") : "";
    const images = (files.images || []).map((file) => path.relative(ROOT, file.path).replace(/\\/g, "/"));

    const parseList = (value) => {
      if (!value) return [];
      try { return JSON.parse(value); } catch { return []; }
    };

    const recipe = await Recipe.create({
      author: req.user._id,
      title: req.body.title,
      description: req.body.description,
      shortDescription: req.body.shortDescription || "",
      category: req.body.category || "other",
      cuisine: req.body.cuisine || "",
      difficulty: req.body.difficulty || "easy",
      cookTime: Number(req.body.cookTime || 0),
      servings: Number(req.body.servings || 1),
      status: req.body.status || "draft",
      isPublic: String(req.body.isPublic ?? "true") !== "false",
      dietType: parseList(req.body.dietType),
      tags: parseList(req.body.tags),
      tips: parseList(req.body.tips),
      equipment: parseList(req.body.equipment),
      ingredients: parseList(req.body.ingredients),
      steps: parseList(req.body.steps),
      nutrition: req.body.nutrition ? JSON.parse(req.body.nutrition) : undefined,
      thumbnail,
      images,
    });

    const populated = await Recipe.findById(recipe._id).populate("author", "name avatar role");
    return res.status(201).json({ success: true, recipe: normalizeRecipe(populated), message: "Recipe created" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/recipes/:id", auth, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });
  if (String(recipe.author) !== String(req.user._id) && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not allowed" });
  }

  ["title", "description", "shortDescription", "category", "cuisine", "difficulty"].forEach((field) => {
    if (req.body[field] !== undefined) recipe[field] = req.body[field];
  });
  if (req.body.cookTime !== undefined) recipe.cookTime = Number(req.body.cookTime);
  if (req.body.servings !== undefined) recipe.servings = Number(req.body.servings);

  await recipe.save();
  const populated = await Recipe.findById(recipe._id).populate("author", "name avatar role");
  return res.json({ success: true, recipe: normalizeRecipe(populated) });
});

app.patch("/api/recipes/:id/status", auth, async (req, res) => {
  const { status } = req.body;
  const allowed = ["draft", "published", "archived"];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });
  if (String(recipe.author) !== String(req.user._id) && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not allowed" });
  }

  recipe.status = status;
  await recipe.save();
  const populated = await Recipe.findById(recipe._id).populate("author", "name avatar role");
  return res.json({ success: true, recipe: normalizeRecipe(populated) });
});

app.patch("/api/recipes/:id/feature", auth, requireAdmin, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });
  recipe.isFeatured = !recipe.isFeatured;
  await recipe.save();
  const populated = await Recipe.findById(recipe._id).populate("author", "name avatar role");
  return res.json({ success: true, recipe: normalizeRecipe(populated) });
});

app.delete("/api/recipes/:id", auth, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });
  if (String(recipe.author) !== String(req.user._id) && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Not allowed" });
  }

  await Recipe.findByIdAndDelete(req.params.id);
  await User.updateMany({ savedRecipes: req.params.id }, { $pull: { savedRecipes: req.params.id } });
  await Comment.deleteMany({ "recipe._id": req.params.id });
  return res.json({ success: true, message: "Recipe deleted" });
});

app.post("/api/recipes/:id/save", auth, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });

  const saved = req.user.savedRecipes.some((id) => String(id) === String(recipe._id));
  if (saved) {
    await User.updateOne({ _id: req.user._id }, { $pull: { savedRecipes: recipe._id } });
    return res.json({ success: true, saved: false });
  }

  await User.updateOne({ _id: req.user._id }, { $addToSet: { savedRecipes: recipe._id } });
  return res.json({ success: true, saved: true });
});

app.get("/api/comments", auth, requireAdmin, async (req, res) => {
  const comments = await Comment.find().sort({ createdAt: -1 }).limit(Number(req.query.limit || 50));
  return res.json({ success: true, comments });
});

app.delete("/api/comments/:id/admin", auth, requireAdmin, async (req, res) => {
  const deleted = await Comment.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: "Comment not found" });
  return res.json({ success: true, message: "Comment deleted" });
});

app.use((err, _req, res, _next) => {
  console.error("API error:", err);
  res.status(500).json({ success: false, message: err.message || "Server error" });
});

async function start() {
  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || "recipe_nest" });
  console.log("✅ Connected to MongoDB");

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const passwordHash = await bcrypt.hash("Demo@12345", 10);
    await User.create({
      name: "Demo User",
      email: "demo@recipenest.com",
      passwordHash,
      phone: "+977000000000",
      address: "Kathmandu, Nepal",
      role: "customer",
    });
    console.log("✅ Seeded demo user: demo@recipenest.com / Demo@12345");
  }

  app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));
}

start().catch((error) => {
  console.error("Failed to start API:", error);
  process.exit(1);
});
