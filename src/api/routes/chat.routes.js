const { isAuth } = require("../../middleware/auth.middleware");

const { createChat, newComment } = require("../controllers/chat.controller");

const express = require("express");
const ChatRoutes = express.Router();

ChatRoutes.post("/create", [isAuth], createChat);
ChatRoutes.post("/create/masNewComment", [isAuth], newComment);

module.exports = ChatRoutes;
