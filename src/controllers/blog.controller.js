const blogService = require("../services/blog.service");

const getAllBlogs = (req, res) => {
  const blogs = blogService.getAllBlogs();
  res.json(blogs);
};

const getBlogById = (req, res) => {
  const blog = blogService.getBlogById(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }
  res.json(blog);
};

const createBlog = (req, res) => {
  const newBlog = blogService.createBlog(req.body);
  res.status(201).json(newBlog);
};

const updateBlog = (req, res) => {
  const updated = blogService.updateBlog(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ message: "Blog not found" });
  }
  res.json(updated);
};

const deleteBlog = (req, res) => {
  const deleted = blogService.deleteBlog(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Blog not found" });
  }
  res.json({ message: "Blog deleted successfully", blog: deleted });
};

module.exports = {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
};