const { isAuth } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/files.middleware");
const {
  createMountainRoute,
  toggleInterestedMountainRouteToUser,
  getMountainRouteFollowingStatus,
  getAllMountainRoutes,
  getMountainRouteById,
  updateMountainRoute,
  deleteMountainRoute,
} = require("../controllers/mountainRoute.controller");

const express = require("express");
const MountainRouteRoutes = express.Router();

MountainRouteRoutes.get("/", getAllMountainRoutes);
MountainRouteRoutes.get("/:id", getMountainRouteById);
MountainRouteRoutes.get(
  "/getMountainRouteFollowingStatus/:id",
  [isAuth],
  getMountainRouteFollowingStatus,
);
//MountainRouteRoutes.post("/createMountainRoute", [isAuth], upload.single("image"), createMountainRoute);
MountainRouteRoutes.post(
  "/createMountainRoute",
  [isAuth],
  upload.array("images[]", 20),
  createMountainRoute,
);
MountainRouteRoutes.post(
  "/toggleInterestedMountainRouteToUser/:id",
  [isAuth],
  toggleInterestedMountainRouteToUser,
);
MountainRouteRoutes.patch(
  "/updateMountainRoute/:id",
  [isAuth],
  upload.single("image"),
  updateMountainRoute,
);
MountainRouteRoutes.delete(
  "/deleteMountainRoute/:id",
  [isAuth],
  deleteMountainRoute,
);

module.exports = MountainRouteRoutes;
