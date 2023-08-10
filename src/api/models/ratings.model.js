const mongoose = require("mongoose");

const RatingsSchema = new mongoose.Schema(
  {
    //Puntuacion. Pendiente de revisar con el equipo: el enum.
    score: {
      type: Number,
      min: 0,
      max: 5,
      required: true,
    },

    // Usuario que crea el rating
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Reference: Populado (usuario, oferta) (Preguntar a pedro a que se refiere? Se refiere al textArea donde escribes el comentario, que puede ser tanto para el user como para la oferta?)
    referenceDeveloper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    referenceCityRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CityRoute",
      required: false,
    },

    referenceMountainRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MountainRoute",
      required: false,
    },
  },

  {
    timestamps: true,
  },
);

// we create the data schema model for mongoose
const Ratings = mongoose.model("Ratings", RatingsSchema);
module.exports = Ratings;
