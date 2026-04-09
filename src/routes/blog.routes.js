const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blog.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogById);
router.post("/", authMiddleware,blogController.createBlog);
router.put("/:id", authMiddleware,blogController.updateBlog);
router.delete("/:id",authMiddleware, blogController.deleteBlog);

module.exports = router;