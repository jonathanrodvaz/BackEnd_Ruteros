const MountainRoute = require("../models/mountainRoute.model");
const User = require("../models/user.model");
const { CityRouteErrors } = require("../../helpers/jsonResponseMsgs");
const { deleteImgCloudinary } = require("../../middleware/files.middleware");

//! -----------------------------------------------------------------------
//? -------------------------CREATE Route ---------------------------------
//! -----------------------------------------------------------------------
const createMountainRoute = async (req, res, next) => {
  try {
    const mountainRouteBody = {
      owner: req.user._id,
      routeName: req.body.routeName,
      difficulty: req.body.difficulty,
      routeDuration: req.body.routeDuration,
      routeDistance: req.body.routeDistance,
      descriptionGeneral: req.body.descriptionGeneral,
      routeLocation: req.body.routeLocation,
      routeStartLatitude: req.body.routeStartLatitude,
      routeStartLongitude: req.body.routeStartLongitude,
      routeEndLatitude: req.body.routeEndLatitude,
      routeEndLongitude: req.body.routeEndLongitude,
      itemsToCarry: req.body.itemsToCarry,
      routeState: req.body.routeState,
    };

    const newRoute = new MountainRoute(mountainRouteBody);

    try {
      if (req.files) {
        newRoute.image = req.files[0].path;
        const fileUrls = req.files.map((file) => file.path);

        newRoute.images = fileUrls;
      } else {
        newRoute.image = "https://pic.onlinewebfonts.com/svg/img_181369.png";
      }
    } catch (error) {
      return res.status(404).json("Error creating mountain route");
    }

    try {
      // aqui guardamos en la base de datos
      const savedRoute = await newRoute.save();
      if (savedRoute) {
        // ahora lo que tenemos que guardar el id en el array de routes de quien lo creo
        try {
          await User.findByIdAndUpdate(req.user._id, {
            $push: { mountainRoutesCreated: newRoute._id },
          });
          return res.status(200).json(savedRoute);
        } catch (error) {
          return res.status(404).json("error updating user route");
        }
      } else {
        return res.status(404).json("Error creating route");
      }
    } catch (error) {
      return res.status(404).json("error saving route");
    }
  } catch (error) {
    next(error);
    return res.status(500).json(error.message);
  }
};

//! ---------------------------------------------------------------------
//? ------------ Toggle Interested Mountain Route To User ---------------
//! ---------------------------------------------------------------------
const toggleInterestedMountainRouteToUser = async (req, res, next) => {
  try {
    const routeId = req.params.id;
    const userId = req.user._id;

    const route = await MountainRoute.findById(routeId);
    const user = await User.findById(userId);

    if (!route || !user) {
      return res.status(404).json("User or route not found");
    }

    const routeInUserRoutesInterestedArray = await User.findOne({
      _id: userId,
      mountainRoutesInterested: routeId,
    });

    if (!routeInUserRoutesInterestedArray) {
      await User.findByIdAndUpdate(userId, {
        $push: { mountainRoutesInterested: routeId },
      });
      await MountainRoute.findByIdAndUpdate(routeId, {
        $push: { interestedUsers: userId },
      });
      return res
        .status(200)
        .json("Mountain route added to user's mountainRoutesInterested array");
    } else {
      await User.findByIdAndUpdate(userId, {
        $pull: { mountainRoutesInterested: routeId },
      });
      await MountainRoute.findByIdAndUpdate(routeId, {
        $pull: { interestedUsers: userId },
      });
      return res
        .status(200)
        .json(
          "Mountain route removed from user's mountainRoutesInterested array",
        );
    }
  } catch (error) {
    next(error);
    return res.status(500).json(error.message);
  }
};

//! -----------------------------------------------------------------------------
//? ------------------------ GET MOUNTAIN ROUTE FOLLOWING STATUS -------------------------
//! -----------------------------------------------------------------------------
const getMountainRouteFollowingStatus = async (req, res, next) => {
  try {
    // ID de la oferta a seguir por parte del usuario logueado.
    const { id } = req.params;

    // ID del usuario logueado.
    const { _id } = req.user._id;

    const routeId = id;
    const logerUserId = _id;

    const logedUser = await User.findById(logerUserId);

    if (!logedUser) {
      return res.status(404).json({ error: "Loged user not found" });
    }

    const routeToFollow = await MountainRoute.findById(routeId);

    if (!routeToFollow) {
      return res
        .status(404)
        .json({ error: "Route to follow by loged user not found" });
    }

    const isRouteInRoutesInterestedArr =
      logedUser.mountainRoutesInterested.find(
        (user) => user._id.toString() === routeId,
      );

    if (isRouteInRoutesInterestedArr === undefined) {
      // La ruta a seguir no está en el array 'mountainRoutesInterested',
      // reportamos que la oferta no está en el array.
      return res.status(200).json({
        status: "Route is Not in user's mountainRoutesInterested array",
      });
    } else {
      // La ruta a seguir está en el array 'mountainRoutesInterested',
      // por lo tanto reportamos al front que la
      // oferta en la que está ineresado el user está
      // en el array mountainRoutesInterested.
      return res.status(200).json({
        status: "Route is in user's mountainRoutesInterested array",
      });
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ------------------------------GET ALL ROUTES ------------------------
//! ---------------------------------------------------------------------

const getAllMountainRoutes = async (req, res, next) => {
  try {
    const MountainRoutes = await MountainRoute.find()
      .populate("owner")
      .populate("comments")
      .populate("ratings")
      .populate("interestedUsers");

    if (MountainRoutes) {
      return res.status(200).json(MountainRoutes);
    } else {
      return res.status(404).json(CityRouteErrors.FAIL_SEARCHING_CITY_ROUTE);
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ------------------------------GETROUTEBYID -------------------------------
//! ---------------------------------------------------------------------
const getMountainRouteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const routeById = await MountainRoute.findById(id)
      .populate("owner")
      .populate("comments")
      .populate("ratings")
      .populate("interestedUsers");
    if (routeById) {
      return res.status(200).json(routeById);
    } else {
      return res
        .status(404)
        .json(CityRouteErrors.FAIL_SEARCHING_CITY_ROUTE_BY_ID);
    }
  } catch (error) {
    return next(error);
  }
};

//! -------------------------------------------------------------------
//? ----------------------------- UPDATE --------------------------------
//! ---------------------------------------------------------------------
//Revisar filterbody. Pregunta a quien revise esto: ¿Se puede meter por filterbody un valor cuyo required sea 'true'? ¿O dará problemas? En caso de problemas, revisar esto.
const updateMountainRoute = async (req, res, next) => {
  try {
    // let newImage = "";

    // if (req.file) {
    //   newImage = req.file.path;
    // } else {
    //   newImage = "https://pic.onlinewebfonts.com/svg/img_181369.png";
    // }

    const mountainRouteBody = {
      routeName: req.body.routeName,
      difficulty: req.body.difficulty,
      routeDuration: req.body.routeDuration,
      descriptionGeneral: req.body.descriptionGeneral,
      routeLocation: req.body.routeLocation,
      itemsToCarry: req.body.itemsToCarry,
      routeState: req.body.routeState,
      owner: req.user._id,
      image: req.body.image,
      images: req.body.image,
    };

    const { id } = req.params;

    const routeById = await MountainRoute.findById(id);
    if (routeById) {
      const patchRoute = new MountainRoute(mountainRouteBody);
      patchRoute._id = id;
      await MountainRoute.findByIdAndUpdate(id, patchRoute); // Guardar los cambios en la base de datos
      return res.status(200).json(await MountainRoute.findById(id)); // Responder con el objeto actualizado
    } else {
      return res.status(404).json(CityRouteErrors.FAIL_UPDATING_CITY_ROUTE);
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------
//? -----------------------------DELETE ROUTE------------------------------
//! -----------------------------------------------------------------------
const deleteMountainRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedRoute = await MountainRoute.findByIdAndDelete(id);

    if (deletedRoute) {
      if (await MountainRoute.findById(id)) {
        return res.status(404).json("failed deleting");
      } else {
        // if (deletedRoute.image) {
        //   deleteImgCloudinary(deletedRoute.image);
        // }

        if (deletedRoute.images) {
          deletedRoute.images.map((image) => deleteImgCloudinary(image));
        }

        try {
          await User.updateMany(
            { mountainRoutesCreated: id },
            {
              $pull: { mountainRoutesCreated: id },
            },
          );

          try {
            await User.updateMany(
              { mountainRoutesInterested: id },
              {
                $pull: { mountainRoutesInterested: id },
              },
            );

            try {
              // // lo que queremos es borrar todos los comentarios de esta oferta priva
              // await Comment.deleteMany({ mountainRoutePrivates: id });

              /// por ultimo lanzamos un test en el runtime para ver si se ha borrado la review correctamente
              return res.status(200).json({
                deletedObject: deletedRoute,
                test: (await MountainRoute.findById(id))
                  ? "fail deleting MountainRoute"
                  : "success deleting MountainRoute",
              });
            } catch (error) {
              return res
                .status(404)
                .json("failed updating user mountainRoutesInterested");
            }
          } catch (error) {
            return res
              .status(404)
              .json("failed updating user mountainRoutesInterested");
          }
        } catch (error) {
          return res
            .status(404)
            .json("failed updating user mountainRoutesCreated");
        }
      }
    } else {
      return res.status(404).json({ message: "Fail deleting mountainRoute" });
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createMountainRoute,
  toggleInterestedMountainRouteToUser,
  getMountainRouteFollowingStatus,
  getAllMountainRoutes,
  getMountainRouteById,
  updateMountainRoute,
  deleteMountainRoute,
};
