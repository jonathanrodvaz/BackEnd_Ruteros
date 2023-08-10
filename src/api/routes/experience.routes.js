const { isAuth } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/files.middleware");
const {
  createExperience,
  getAllExperiences,
  getByIdExperience,
  getByUserExperience,
  deleteExperience,
} = require("../controllers/experience.controllers");

const express = require("express");
const ExperienceRoutes = express.Router();

ExperienceRoutes.post(
  "/create",
  [isAuth],
  upload.single("image"),
  createExperience,
);
ExperienceRoutes.get("/", getAllExperiences);
ExperienceRoutes.get("/:id", getByIdExperience);
ExperienceRoutes.get("/experience/:id", getByUserExperience);
ExperienceRoutes.delete("/deleteExperience/:id", deleteExperience);

module.exports = ExperienceRoutes;
