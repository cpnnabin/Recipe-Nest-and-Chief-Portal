const { blogs } = require("../models/blog.model");

const getAllBlogs = () => {
  return blogs;
};

const getBlogById = (id) => {
  return blogs.find((blog) => blog.id === parseInt(id));
};

const createBlog = (newBlog) => {
  newBlog.id = blogs.length + 1;
  blogs.push(newBlog);
  return newBlog;
};

const updateBlog = (id, updatedData) => {
  const index = blogs.findIndex((blog) => blog.id === parseInt(id));
  if (index === -1) return null;
  blogs[index] = { ...blogs[index], ...updatedData };
  return blogs[index];
};

const deleteBlog = (id) => {
  const index = blogs.findIndex((blog) => blog.id === parseInt(id));
  if (index === -1) return null;
  const deleted = blogs.splice(index, 1);
  return deleted[0];
};

module.exports = {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
};