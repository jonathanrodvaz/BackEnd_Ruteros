const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    //Contenido del comentario.
    commentContent: {
      type: String,
      required: true,
    },

    //Reference. a quien se refiere ? Yo lo entiendo como 'destinatario', pendiente de revisar con el equipo.
    referenceUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // referenceMountainRouteComment: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Offer",
    //   required: false,
    // },

    // referenceCityRouteComment: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Offer",
    //   required: false,
    // },

    referenceMountainRouteComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MountainRoute",
      required: false,
    },

    referenceCityRouteComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CityRoute",
      required: false,
    },

    //Like: Usuarios que le han dado like.
    likes: {
      type: [String],
      required: false,
      default: [],
    },

    //Type: Privado o público
    commentType: {
      type: String,
      enum: ["Privado", "Publico"],
      required: true,
    },
  },

  {
    timestamps: true,
  },
);

// we create the data schema model for mongoose
const Comment = mongoose.model("Comment", CommentSchema);
module.exports = Comment;
