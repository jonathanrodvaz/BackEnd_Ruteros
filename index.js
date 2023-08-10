//! creamos el servidor web
const { configCloudinary } = require("./src/middleware/files.middleware");
const { connect } = require("./src/utils/db");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const BASE_URL = process.env.BASE_URL;

//! conectamos con la base de datos
connect();
const app = express();
configCloudinary();
const PORT = process.env.PORT;

//! configurar las cors
const cors = require("cors");
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

//! limitaciones en la recepcion y envio de datos en 5mb
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: false }));

//! -----ROUTES-----------
const UserRoutes = require("./src/api/routes/user.routes");

const CityRoutes = require("./src/api/routes/city.routes");
const ratingRoutes = require("./src/api/routes/rating.routes");
const CommentRoutes = require("./src/api/routes/comment.routes");
const ChatRoutes = require("./src/api/routes/chat.routes");

const MountainRouteRoutes = require("./src/api/routes/mountainRoutes.routes");

const ExperienceRoutes = require("./src/api/routes/experience.routes");

app.use("/api/v1/mountainRoute", MountainRouteRoutes);
app.use("/api/v1/city", CityRoutes);
app.use("/api/v1/chat", ChatRoutes);
app.use("/api/v1/comment", CommentRoutes);
app.use("/api/v1/rating", ratingRoutes);

app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/experience", ExperienceRoutes);

//! Cuando no se mete ninguna routa
app.use("*", (req, res, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  return next(error);
});

//! ERRO 500 DEL SERVER
app.use((error, req, res) => {
  return res
    .status(error.status || 500)
    .json(error.message || "Unexpected error");
});

//! ----ESCUCHAMOS EN EL PORT LA BASE DE DATOS ------
app.disable("x-powered-by");
app.listen(PORT, () => {
  console.log(`Listening on PORT ${BASE_URL}${PORT}`);
});
