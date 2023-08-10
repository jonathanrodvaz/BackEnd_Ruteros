const { isAuth } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/files.middleware");
const {
  registerSlow,
  sendCode,
  login,
  changeForgottenPassword,
  sendPassword,
  changePassword,
  update,
  updateHabilities,
  deleteUser,
  getAll,
  getById,
  getByToken,
  checkNewUser,
  changeEmail,
  sendNewCode,
  verifyNewEmail,
  autoLogin,
  resendCode,
  banned,
  following,
  getFollowingStatus,
  // updateUserRol,
} = require("../controllers/user.controllers");

const express = require("express");
const UserRoutes = express.Router();

UserRoutes.get("/", getAll);
UserRoutes.get("/:id", getById);
UserRoutes.get("/getUserByToken/getUserByToken", [isAuth], getByToken);
// UserRoutes.post("/register", upload.single("image"), registerSlow);
UserRoutes.patch("/forgotpassword/forgotpassword/", changeForgottenPassword);
UserRoutes.post("/register", upload.array("images[]", 20), registerSlow);
UserRoutes.post("/login", login);
UserRoutes.patch("/changepassword", [isAuth], changePassword);
UserRoutes.patch("/update/update", [isAuth], upload.single("image"), update);
UserRoutes.patch("/updateHabilities", [isAuth], updateHabilities);
UserRoutes.patch("/banned", [isAuth], banned);
UserRoutes.patch("/following/:id", [isAuth], following);
UserRoutes.get("/followingStatus/:id", [isAuth], getFollowingStatus);
UserRoutes.delete("/", [isAuth], deleteUser);
UserRoutes.post("/check", checkNewUser);
UserRoutes.post("/changeEmail", [isAuth], changeEmail);
UserRoutes.post("/verifyNewEmail", [isAuth], verifyNewEmail);
UserRoutes.post("/login/autologin", autoLogin);
UserRoutes.post("/resend", resendCode);
// UserRoutes.patch("/rol", [isAuth], updateUserRol);

//!---------------- REDIRECT-------------------------------
UserRoutes.get("/register/sendMail/:id", sendCode);
UserRoutes.patch("/sendPassword/:id", sendPassword);
UserRoutes.get("/sendNewCode/:id", [isAuth], sendNewCode);

module.exports = UserRoutes;
