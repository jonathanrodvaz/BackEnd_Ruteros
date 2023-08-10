const User = require("../models/user.model");

const Comment = require("../models/comment.model");

const { CityRouteErrors } = require("../../helpers/jsonResponseMsgs");

const { deleteImgCloudinary } = require("../../middleware/files.middleware");

const CityRoute = require("../models/cityRoutes.model");

//! -----------------------------------------------------------------------
//? -------------------------------CREATE CITY ---------------------------------
//! -----------------------------------------------------------------------
const createCity = async (req, res, next) => {
  try {
    const cityBody = {
      owner: req.user._id,
      difficulty: req.body.difficulty,
      routeName: req.body.routeName,
      routeDistance: req.body.routeDistance,
      routeDuration: req.body.routeDuration,
      descriptionGeneral: req.body.descriptionGeneral,
      routeLocation: req.body.routeLocation,
      routeStartLatitude: req.body.routeStartLatitude,
      routeStartLongitude: req.body.routeStartLongitude,
      routeEndLatitude: req.body.routeEndLatitude,
      routeEndLongitude: req.body.routeEndLongitude,
      itemsToCarry: req.body.itemsToCarry,
      routeState: req.body.routeState,
    };

    const newCity = new CityRoute(cityBody);

    try {
      if (req.files) {
        newCity.image = req.files[0].path;
        const fileUrls = req.files.map((file) => file.path);

        newCity.images = fileUrls;
      } else {
        newCity.image =
          "https://res.cloudinary.com/dxpdntpqm/image/upload/v1689155185/Imagen_general_base_city_tvs85z.png";
      }
    } catch (error) {
      return res.status(404).json("Error creating city route");
    }

    try {
      // aqui guardamos en la base de datos
      const savedCity = await newCity.save();
      if (savedCity) {
        // ahora lo que tenemos que guardar el id en el array de city de quien lo creo
        try {
          await User.findByIdAndUpdate(req.user._id, {
            $push: { cityRoutesCreated: newCity._id },
          });
          return res.status(200).json(savedCity);
        } catch (error) {
          return res.status(404).json("error updating user city");
        }
      } else {
        return res.status(404).json("Error creating city");
      }
    } catch (error) {
      return res.status(404).json("error saving city");
    }
  } catch (error) {
    next(error);
    return res.status(500).json(error.message);
  }
};

//! ---------------------------------------------------------------------
//? ------------ Toggle Interested City To User ------------------------
//! ---------------------------------------------------------------------
const toggleInterestedCityToUser = async (req, res, next) => {
  try {
    const cityId = req.params.id;
    const userId = req.user._id;

    const city = await CityRoute.findById(cityId);
    const user = await User.findById(userId);

    if (!city || !user) {
      return res.status(404).json("User or city not found");
    }

    const cityInUserCitysInterestedArray = await User.findOne({
      _id: userId,
      cityRoutesInterested: cityId,
    });

    if (!cityInUserCitysInterestedArray) {
      await User.findByIdAndUpdate(userId, {
        $push: { cityRoutesInterested: cityId },
      });
      await CityRoute.findByIdAndUpdate(cityId, {
        $push: { interestedUsers: userId },
      });
      return res.status(200).json("City added to user's citysInterested array");
    } else {
      await User.findByIdAndUpdate(userId, {
        $pull: { cityRoutesInterested: cityId },
      });
      await CityRoute.findByIdAndUpdate(cityId, {
        $pull: { interestedUsers: userId },
      });
      return res
        .status(200)
        .json("City removed from user's citysInterested array");
    }
  } catch (error) {
    next(error);
    return res.status(500).json(error.message);
  }
};

//! -----------------------------------------------------------------------------
//? --------------- GET CITY FOLLOWING STATUS -------------------------
//! -----------------------------------------------------------------------------
const getCityFollowingStatus = async (req, res, next) => {
  try {
    // ID de la oferta a seguir por parte del usuario logueado.
    const { id } = req.params;

    // ID del usuario logueado.
    const { _id } = req.user._id;

    const cityId = id;
    const logerUserId = _id;

    const logedUser = await User.findById(logerUserId);

    if (!logedUser) {
      return res.status(404).json({ error: "Loged user not found" });
    }

    const cityToFollow = await CityRoute.findById(cityId);

    if (!cityToFollow) {
      return res
        .status(404)
        .json({ error: "City to follow by loged user not found" });
    }

    const isCityInCitysInterestedArr = logedUser.cityRoutesInterested.find(
      (user) => user._id.toString() === cityId,
    );

    if (isCityInCitysInterestedArr === undefined) {
      // La oferta a seguir no está en el array 'citiessInterested',
      // reportamos que la oferta no está en el array.
      return res.status(200).json({
        status: "City is Not in user's citysInterested arr",
      });
    } else {
      // La oferta a seguir está en el array 'citiessInterested',
      // por lo tanto reportamos al front que la
      // oferta en la que está ineresado el user está
      // en el array citiesInterested.
      return res.status(200).json({
        status: "City is in user's citysInterested arr",
      });
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ------------------------------GET ALL CITYS --------------------------
//! ---------------------------------------------------------------------

const getAll = async (req, res, next) => {
  try {
    const Citys = await CityRoute.find()
      .populate("owner")
      .populate("comments")
      .populate("ratings")
      .populate("interestedUsers");

    if (Citys) {
      return res.status(200).json(Citys);
    } else {
      return res.status(404).json(CityRouteErrors.FAIL_SEARCHING_CITY_ROUTE);
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ------------------------------GETBYID -------------------------------
//! ---------------------------------------------------------------------
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cityById = await CityRoute.findById(id)
      .populate("owner")
      .populate("comments")
      .populate("ratings")
      .populate("interestedUsers");
    if (cityById) {
      return res.status(200).json(cityById);
    } else {
      return res
        .status(404)
        .json(CityRouteErrors.FAIL_SEARCHING_CITY_ROUTE_BY_ID);
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ----------------------------- GET BY CITYNAME ------------------------
//! ---------------------------------------------------------------------
//Pregunta para quien lo revise: ¿Tiene que haber aquí también un .populate?
const getByCityName = async (req, res, next) => {
  try {
    const { cityName } = req.params;

    const CityNameByName = await CityRoute.find({ cityName });

    if (CityNameByName) {
      return res.status(200).json(CityNameByName);
    } else {
      return res
        .status(404)
        .json(CityRouteErrors.FAIL_SEARCHING_CITY_ROUTE_BY_NAME);
    }
  } catch (error) {
    return next(error);
  }
};

//! -------------------------------------------------------------------
//? ----------------------------- UPDATE --------------------------------
//! ---------------------------------------------------------------------
//Revisar filterbody. Pregunta a quien revise esto: ¿Se puede meter por filterbody un valor cuyo required sea 'true'? ¿O dará problemas? En caso de problemas, revisar esto.
const updateCity = async (req, res, next) => {
  try {
    let newImage;

    if (req.file) {
      newImage = req.file.path;
    } else {
      newImage =
        "https://res.cloudinary.com/dxpdntpqm/image/upload/v1689155185/Imagen_general_base_city_tvs85z.png";
    }

    const filterBody = {
      city: req.body.city,
      difficulty: req.body.difficulty,
      routeName: req.body.routeName,
      routeDistance: req.body.routeDistance,
      routeDuration: req.body.routeDuration,
      descriptionGeneral: req.body.descriptionGeneral,
      routeLocation: req.body.routeLocation,
      itemsToCarry: req.body.itemsToCarry,
      image: newImage,
      routeState: req.body.routeState,
    };

    const { id } = req.params;

    const cityById = await CityRoute.findById(id);
    if (cityById) {
      const patchCity = new CityRoute(filterBody);
      patchCity._id = id;
      await CityRoute.findByIdAndUpdate(id, patchCity); // Guardar los cambios en la base de datos
      return res.status(200).json(await CityRoute.findById(id)); // Responder con el objeto actualizado
    } else {
      return res.status(404).json(CityRouteErrors.FAIL_UPDATING_CITY_ROUTE);
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------
//? -------------------------------DELETE CITY ---------------------------------
//! -----------------------------------------------------------------------
const deleteCity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleteCity = await CityRoute.findByIdAndDelete(id);

    if (deleteCity) {
      if (await CityRoute.findById(id)) {
        return res.status(404).json("failed deleting");
      } else {
        // if (deleteCity.image) {
        //   console.log("image Existe");

        //   deleteImgCloudinary(deleteCity.image);
        // } else {
        //   console.log("image NO existe");
        // }

        if (deleteCity.images) {
          deleteCity.images.map((image) => deleteImgCloudinary(image));
        }

        try {
          await User.updateMany(
            { citiesCreated: id },
            {
              $pull: { citiesCreated: id },
            },
          );

          try {
            await User.updateMany(
              { citiesCreated: id },
              {
                $pull: { citysInterested: id },
              },
            );

            try {
              // lo que queremos es borrar todos los comentarios de esta oferta priva
              await Comment.deleteMany({ cityPrivates: id });

              /// por ultimo lanzamos un test en el runtime para ver si se ha borrado la review correctamente
              return res.status(200).json({
                deletedObject: deleteCity,
                test: (await CityRoute.findById(id))
                  ? "fail deleting city"
                  : "success deleting xity",
              });
            } catch (error) {
              return res
                .status(404)
                .json("failed updating user citysInterested");
            }
          } catch (error) {
            return res.status(404).json("failed updating user citysInterested");
          }
        } catch (error) {
          return res.status(404).json("failed updating user citiesCreated");
        }
      }
    } else {
      return res.status(404).json({ message: "Fail deleting city" });
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCity,
  toggleInterestedCityToUser,
  getCityFollowingStatus,
  getAll,
  getById,
  getByCityName,
  updateCity,
  deleteCity,
};
