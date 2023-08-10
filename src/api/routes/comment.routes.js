const { isAuth } = require("../../middleware/auth.middleware");

const {
  createComment,
  getAll,
  deleteComment,
  toggleFavorite,
  getByReference,
} = require("../controllers/comment.controller");

const express = require("express");
const CommentRoutes = express.Router();

CommentRoutes.post("/", [isAuth], createComment);
CommentRoutes.get("/", getAll);
CommentRoutes.delete("/:id", [isAuth], deleteComment);
CommentRoutes.get("/:refType/:id", getByReference);
CommentRoutes.put("/favorite/:id", [isAuth], toggleFavorite);

module.exports = CommentRoutes;
