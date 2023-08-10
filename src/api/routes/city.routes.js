const { isAuth } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/files.middleware");
const {
  createCity,
  toggleInterestedCityToUser,
  getCityFollowingStatus,
  getAll,
  getById,
  updateCity,
  deleteCity,
} = require("../controllers/city.controller");

const express = require("express");
const CityRoutes = express.Router();

CityRoutes.get("/", getAll);
CityRoutes.get("/:id", getById);
CityRoutes.patch(
  "/updateCity/:id",
  [isAuth],
  upload.single("image"),
  updateCity,
);

CityRoutes.post(
  "/createCity",
  [isAuth],
  upload.array("images[]", 20),
  createCity,
);

CityRoutes.post(
  "/toggleInterestedCityToUser/:id",
  [isAuth],
  toggleInterestedCityToUser,
);
CityRoutes.delete("/deleteCity/:id", deleteCity);
CityRoutes.get("/cityFollowingStatus/:id", [isAuth], getCityFollowingStatus);

module.exports = CityRoutes;
