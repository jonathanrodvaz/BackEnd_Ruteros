const { isAuth } = require("../../middleware/auth.middleware");
const {
  create,
  deleteRating,
  updateRating,
  getByReference,
  getCityRouteRating,
  getAll,
} = require("../controllers/rating.controllers");

const express = require("express");
const ratingRoutes = express.Router();

ratingRoutes.get("/", getAll);
ratingRoutes.post("/", [isAuth], create);
ratingRoutes.delete("/:id", [isAuth], deleteRating);
ratingRoutes.patch("/:id", [isAuth], updateRating);
ratingRoutes.get("/:refType/:id", [isAuth], getByReference);
ratingRoutes.get("/getCityRouteRating/:id", [isAuth], getCityRouteRating);

module.exports = ratingRoutes;
