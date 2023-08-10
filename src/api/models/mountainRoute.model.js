const mongoose = require("mongoose");

const MountainRouteSchema = new mongoose.Schema(
  {
    // Usuarios que siguen la oferta
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },

    routeName: {
      type: String,
      required: true,
    },

    routeDistance: {
      type: Number,
      required: false,
    },

    routeDuration: {
      type: Number,
      required: false,
    },

    descriptionGeneral: {
      type: String,
      required: true,
    },

    routeLocation: {
      type: String,
      required: true,
    },

    routeStartLatitude: {
      type: Number,
      required: true,
    },

    routeStartLongitude: {
      type: Number,
      required: true,
    },

    routeEndLatitude: {
      type: Number,
      required: true,
    },

    routeEndLongitude: {
      type: Number,
      required: true,
    },

    //Cosas que se recomiendan llevar en la ruta
    itemsToCarry: {
      type: [String],
      required: true,
      default: [],
    },

    // imagen de la ruta
    image: {
      type: String,
      required: false,
    },

    images: {
      type: [String],
      required: true,
      default: [],
    },

    comments: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Comment",
      required: false,
      default: [],
    },

    ratings: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Ratings",
      required: false,
      default: [],
    },

    interestedUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: false,
      default: [],
    },

    // routeState
    routeState: {
      type: String,
      enum: ["Close", "Abandoned", "Open"],
      required: true,
    },
  },

  {
    timestamps: true,
  },
);

// we create the data schema model for mongoose
const MountainRoute = mongoose.model("MountainRoute", MountainRouteSchema);
module.exports = MountainRoute;
