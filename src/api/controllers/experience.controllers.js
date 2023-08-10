//const mongoose = require("mongoose");
const Experience = require("../models/experience.model");
const User = require("../models/user.model");
//! -----------------------------------------------------------------------------
//? ---------------------------- CREATE -----------------------------------------
//! -----------------------------------------------------------------------------

const createExperience = async (req, res) => {
  let cathImg = req.file?.path;
  try {
    const experienceBody = {
      owner: req.user._id,
      title: req.body.title,
      duration: req.body.duration,
      habilities: req.body.habilities,
      description: req.body.description,
      image: cathImg,
    };

    const newExperience = new Experience(experienceBody);
    try {
      const savedExperience = await newExperience.save();
      if (savedExperience) {
        try {
          await User.findByIdAndUpdate(req.user._id, {
            $push: { experience: newExperience._id },
          });
          return res.status(200).json(newExperience);
        } catch (error) {
          return res.status(404).json("Error updating user experience");
        }
      } else {
        return res.status(404).json("Error creating experience");
      }
    } catch (error) {
      console.log(error);
      return res.status(404).json("Error saving experience");
    }
  } catch (error) {
    return res.status(500).json(error.message);
  }
};

//! -----------------------------------------------------------------------------
//? ---------------------------- GetAll -----------------------------------------
//! -----------------------------------------------------------------------------

const getAllExperiences = async (req, res, next) => {
  try {
    const allExperiences = await Experience.find();
    if (allExperiences) {
      return res.status(200).json(allExperiences);
    } else {
      return res.status(404).json("No experiences found");
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? ---------------------------- GetById -----------------------------------------
//! -----------------------------------------------------------------------------

const getByIdExperience = async (req, res, next) => {
  try {
    const { id } = req.params;
    const experienceById = await Experience.findById(id);

    if (experienceById) {
      return res.status(200).json(experienceById);
    } else {
      return res.status(404).json("Not found experience by Id");
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? ---------------------------- GetByUser -----------------------------------------
//! -----------------------------------------------------------------------------

const getByUserExperience = async (req, res, next) => {
  try {
    // id del usuario
    const { id } = req.params;
    const experienceByUser = await Experience.find({ owner: id });
    if (experienceByUser) {
      return res.status(200).json(experienceByUser);
    } else {
      return res.status(404).json("User experience not found");
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? ---------------------------- DELETE -----------------------------------------
//! -----------------------------------------------------------------------------

const deleteExperience = async (req, res, next) => {
  try {
    const { id } = req.params;
    const experienceToDelete = await Experience.findById(id);

    if (!experienceToDelete) {
      return res.status(404).json("Experience not found");
    } else {
      const idUser = experienceToDelete.owner;

      await User.findByIdAndUpdate(idUser, {
        $pull: { experience: id },
      });

      await Experience.findByIdAndDelete(id);

      if (await Experience.findById(id)) {
        return res.status(404).json("The experience has not been deleted");
      } else {
        return res.status(200).json("Experience deleted");
      }
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createExperience,
  getAllExperiences,
  getByIdExperience,
  getByUserExperience,
  deleteExperience,
};
