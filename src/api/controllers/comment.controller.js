const User = require("../models/user.model");
const Comment = require("../models/comment.model");
const MountainRoute = require("../models/mountainRoute.model");
const CityRoute = require("../models/cityRoutes.model");
const {
  CommentErrors,
  CommentSuccess,
} = require("../../helpers/jsonResponseMsgs");
const { ObjectId } = require("mongodb");

//! -----------------------------------------------------------------------
//? -------------------------------CREATE COMMENT ---------------------------------
//! -----------------------------------------------------------------------

const createComment = async (req, res, next) => {
  try {
    const commentBody = {
      commentContent: req.body.commentContent,
      owner: req.user._id,
      commentType: req.body.commentType,
      referenceUser: req.body.referenceUser,
      referenceMountainRouteComment: req.body.referenceMountainRouteComment,
      referenceCityRouteComment: req.body.referenceCityRouteComment,
    };
    const newComment = new Comment(commentBody);
    try {
      const savedComment = await newComment.save();

      if (savedComment) {
        try {
          await User.findByIdAndUpdate(req.user._id, {
            $push: { commentsByMe: newComment._id },
          });
          try {
            if (req.body.referenceMountainRouteComment) {
              await MountainRoute.findByIdAndUpdate(
                req.body.referenceMountainRouteComment,
                {
                  $push: { comments: newComment._id },
                },
              );
              return res.status(200).json(savedComment);
            } else {
              try {
                if (req.body.referenceUser) {
                  await User.findByIdAndUpdate(req.body.referenceUser, {
                    $push: { commentsByOthers: newComment._id },
                  });
                  return res.status(200).json(savedComment);
                } else {
                  try {
                    if (req.body.referenceCityRouteComment) {
                      await CityRoute.findByIdAndUpdate(
                        req.body.referenceCityRouteComment,
                        {
                          $push: { comments: newComment._id },
                        },
                      );
                      return res.status(200).json(savedComment);
                    }
                  } catch (error) {
                    return res
                      .status(404)
                      .json("error updating user referenceCityRoute");
                  }
                }
              } catch (error) {
                return res
                  .status(404)
                  .json("error updating user reviews with him");
              }
            }
          } catch (error) {
            return res
              .status(404)
              .json("error updating referenceMountainRoute model");
          }
        } catch (error) {
          return res.status(404).json("error updating owner user comment ");
        }
      } else {
        return res.status(404).json("Error creating comment");
      }
    } catch (error) {
      return res.status(404).json("error saving comment");
    }
  } catch (error) {
    next(error);
    return res.status(500).json(error.message);
  }
};
//! ---------------------------------------------------------------------
//? ------------------------------GET ALL -------------------------------
//! ---------------------------------------------------------------------

const getAll = async (req, res, next) => {
  try {
    const allComments = await Comment.find();
    if (allComments) {
      return res.status(200).json(allComments);
    } else {
      return res.status(404).json(CommentErrors.FAIL_SEARCHING_COMMENTS);
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------------------------
//? ----------------------------- DELETE --------------------------------------------------
//! ---------------------------------------------------------------------------------------

const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedComment = await Comment.findByIdAndDelete(id);
    if (deletedComment) {
      //Solo lo borramos del commentsByMe, en User.
      await User.updateMany(
        { commentsByMe: id },
        {
          $pull: { commentsByMe: id },
        },
      );

      try {
        await User.updateMany(
          { comentsThatILike: id },
          {
            $pull: { comentsThatILike: id },
          },
        );

        return res.status(200).json({
          deletedObject: deletedComment,
          message: CommentSuccess.SUCCESS_DELETING_COMMENT,
        });
      } catch (error) {
        return next(error);
      }
    } else {
      return res.status(404).json(CommentErrors.FAIL_DELETING_COMMENT);
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ------------------------------LIKE--------------------------------
//! ---------------------------------------------------------------------
const toggleFavorite = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;
    //userIdPageDetail es el propietario del comentario
    const userIdPageDetail = req.body.userIdPageDetail;

    const commentFav = await Comment.findById(commentId);
    const user = await User.findById(userId);

    if (!commentFav || !user) {
      return res.status(404).json("User or comment not found");
    }

    if (!commentFav.likes.includes(userId)) {
      await Comment.findByIdAndUpdate(commentId, { $push: { likes: userId } });
      await User.findByIdAndUpdate(userId, {
        $push: { comentsThatILike: commentFav._id },
      });
      const findCommentByUserUpdate = await Comment.find({
        referenceUser: new ObjectId(userIdPageDetail),
      })
        .sort({ createdAt: -1 })
        .populate("owner");

      return res.status(200).json({
        results: "Comment added to liked comments",
        data: findCommentByUserUpdate,
      });
    } else {
      await Comment.findByIdAndUpdate(commentId, { $pull: { likes: userId } });
      await User.findByIdAndUpdate(userId, {
        $pull: { comentsThatILike: commentFav._id },
      });
      return res.status(200).json({
        result: "Comment removed from liked comments",
        data: await Comment.find({
          referenceUser: userIdPageDetail,
        })
          .sort({ createdAt: -1 })
          .populate("owner"),
      });
    }
  } catch (error) {
    return next(
      "Error while adding/removing comment to/from favourites",
      error,
    );
  }
};

//! -----------------------------------------------------------------------
//? -------------------------------GET_BY_REFERENCE ---------------------------------
//! -----------------------------------------------------------------------

const getByReference = async (req, res, next) => {
  try {
    const { refType, id } = req.params;

    let comments;
    if (refType === "MountainRoute") {
      comments = await Comment.find({ referenceMountainRouteComment: id })
        .sort({ createdAt: -1 })
        .populate("owner referenceMountainRouteComment");
      return res.status(200).json(comments);
    } else if (refType === "User") {
      comments = await Comment.find({ referenceUser: id })
        .sort({ createdAt: -1 })
        .populate("owner");
      return res.status(200).json(comments);
    } else if (refType === "CityRoute") {
      comments = await Comment.find({ referenceCityRouteComment: id })
        .sort({ createdAt: -1 })
        .populate("owner referenceCityRouteComment");
      return res.status(200).json(comments);
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

module.exports = {
  createComment,
  getAll,
  deleteComment,
  toggleFavorite,
  getByReference,
};
