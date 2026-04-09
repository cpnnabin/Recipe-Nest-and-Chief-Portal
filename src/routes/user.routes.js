const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id",authMiddleware, userController.updateUser);
router.delete("/:id",authMiddleware, userController.deleteUser);

module.exports = router;