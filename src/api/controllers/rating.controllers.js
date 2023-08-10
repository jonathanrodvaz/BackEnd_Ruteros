const User = require("../models/user.model");
const Ratings = require("../models/ratings.model");
const CityRoute = require("../models/cityRoutes.model");
const MountainRoute = require("../models/mountainRoute.model");
//const PORT = process.env.PORT;
//const BASE_URL = process.env.BASE_URL;
//const BASE_URL_COMPLETE = `${BASE_URL}${PORT}`;
//const { ObjectId } = require("mongodb");

//! -----------------------------------------------------------------------
//? -------------------------------CREATE RATING ---------------------------------
//! -----------------------------------------------------------------------

const create = async (req, res, next) => {
  try {
    const ratingBody = {
      //user es el propietario
      score: req.body.score,
      owner: req.user._id,
      referenceDeveloper: req.body.referenceDeveloper,
      referenceCityRoute: req.body.referenceCityRoute,
      referenceMountainRoute: req.body.referenceMountainRoute,
    };
    const newRating = new Ratings(ratingBody);
    try {
      // aqui guardamos en la base de datos
      const savedRating = await newRating.save();
      if (savedRating) {
        // ahora lo que tenemos que guardar el id en el array de rating de quien lo creo
        try {
          await User.findByIdAndUpdate(req.user._id, {
            $push: { ratingsByMe: newRating._id },
          });
          try {
            if (req.body.referenceCityRoute) {
              await CityRoute.findByIdAndUpdate(req.body.referenceCityRoute, {
                $push: { ratings: newRating._id },
              });
              return res.status(200).json(savedRating);
            } else {
              try {
                if (req.body.referenceDeveloper) {
                  await User.findByIdAndUpdate(req.body.referenceDeveloper, {
                    $push: { ratingsByOthers: newRating._id },
                  });
                  return res.status(200).json(savedRating);
                } else {
                  //////////////////////////
                  try {
                    if (req.body.referenceMountainRoute) {
                      await MountainRoute.findByIdAndUpdate(
                        req.body.referenceMountainRoute,
                        {
                          $push: { ratings: newRating._id },
                        },
                      );
                      return res.status(200).json(savedRating);
                    }
                  } catch (error) {
                    next(error);
                    return res
                      .status(404)
                      .json("error updating referenceMountainRoute model");
                  }
                }
                /////////////////////////////
              } catch (error) {
                next(error);
                return res
                  .status(404)
                  .json("error updating user reviews with him");
              }
            }
          } catch (error) {
            next(error);
            return res
              .status(404)
              .json("error updating referenceCityRoute model");
          }
        } catch (error) {
          next(error);
          return res.status(404).json("error updating owner user rating ");
        }
      } else {
        return res.status(404).json("Error creating rating");
      }
    } catch (error) {
      next(error);
      return res.status(404).json("error saving rating");
    }
  } catch (error) {
    next(error);
    return res.status(500).json(error.message);
  }
};

//! -----------------------------------------------------------------------
//? -------------------------------GET ALL ---------------------------------
//! -----------------------------------------------------------------------

const getAll = async (req, res, next) => {
  try {
    const allRatings = await Ratings.find();
    if (allRatings.length > 0) {
      return res.status(200).json(allRatings);
    } else {
      return res.status(404).json("No ratings found");
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------
//? -------------------------------DELETE RATING ---------------------------------
//! -----------------------------------------------------------------------
const deleteRating = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedRating = await Ratings.findByIdAndDelete(id);
    if (deletedRating) {
      if (await Ratings.findById(id)) {
        return res.status(404).json("failed deleting");
      } else {
        try {
          await User.updateMany(
            { ratings: id },
            {
              $pull: {
                ratingsByMe: id,
                ratingsByOthers: id,
              },
            },
          );

          try {
            await CityRoute.updateMany(
              { ratings: id },
              {
                $pull: { ratings: id },
              },
            );

            await MountainRoute.updateMany(
              { ratings: id },
              {
                $pull: { ratings: id },
              },
            );

            /// por ultimo lanzamos un test en el runtime para ver si se ha borrado la review correctamente
            return res.status(200).json({
              deletedObject: deletedRating,
              test: (await Ratings.findById(id))
                ? "fail_deleting_rating"
                : "success_deleting_rating",
            });
          } catch (error) {
            return res
              .status(404)
              .json("failed updating cityRoute and mountainRoute");
          }
        } catch (error) {
          return res.status(404).json("failed updating user");
        }
      }
    } else {
      return res.status(404).json({ message: "Fail deleting rating" });
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------
//? -------------------------------UPDATE RATING ---------------------------------
//! -----------------------------------------------------------------------

const updateRating = async (req, res, next) => {
  try {
    const { score } = req.body;
    const filterBody = {
      score,
    };
    const { id } = req.params;
    const ratingById = await Ratings.findById(id);
    if (ratingById) {
      const patchRating = new Ratings(filterBody);
      patchRating._id = id;
      try {
        await Ratings.findByIdAndUpdate(id, patchRating);
        return res.status(200).json(await Ratings.findById(id));
      } catch (error) {
        return res.status(404).json("failed updating rating");
      }
    } else {
      return res.status(404).json({ message: "FAIL_UPDATING_RATING" });
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------
//? -------------------------------GET_BY_REFERENCE ---------------------------------
//! -----------------------------------------------------------------------

const getByReference = async (req, res, next) => {
  try {
    const { refType, id } = req.params;
    // refType indica si la valoración viene de una ciudad (CityRoute) o una ruta de montaña (MountainRoute) o un usuario (User), y id es el ID del usuaio queremos buscar sus valoraciones
    let ratings;
    if (refType === "CityRoute") {
      ratings = await Ratings.find({ referenceCityRoute: id }).populate(
        "owner referenceCityRoute",
      );
      return res.status(200).json(ratings);
    } else if (refType === "MountainRoute") {
      ratings = await Ratings.find({ referenceMountainRoute: id }).populate(
        "owner referenceMountainRoute",
      );
      return res.status(200).json(ratings);
    } else if (refType === "User") {
      ratings = await Ratings.find({ referenceDeveloper: id });
      return res.status(200).json(ratings);
    } else {
      return res.status(404).json({
        error:
          "Invalid reference type. It must be either 'User' or 'CityRoute' or 'MountainRoute'.",
      });
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------
//? ---------------------------- GET City Route Rating --------------------
//! -----------------------------------------------------------------------

const getCityRouteRating = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rating = await Ratings.find({ referenceCityRoute: id }).populate(
      "owner referenceCityRoute",
    );

    if (rating) {
      return res.status(200).json(rating);
    } else {
      return res.status(404).json("No rating found");
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  create,
  getAll,
  deleteRating,
  updateRating,
  getByReference,
  getCityRouteRating,
};
