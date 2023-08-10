const User = require("../models/user.model");

//const { setError } = require("../../helpers/handle-error");

//const Ratings = require("../models/ratings.model");
const CityRoute = require("../models/cityRoutes.model");
const MountainRoute = require("../models/mountainRoute.model");

//const Experience = require("../models/experience.model");
const Comment = require("../models/comment.model");
const Chat = require("../models/chat.model");
//const { ObjectId } = require("mongodb");

//! -----------------------------------------------------------------------------
//? ----------------------------CREATE-------------------------------------------
//! -----------------------------------------------------------------------------
const createChat = async (req, res, next) => {
  try {
    const { userOne, userTwo } = req.body;

    const chatExistOne = await User.findOne({ userOne, userTwo });

    const chatExistTwo = await User.findOne({
      userOne: userTwo,
      userTwo: userOne,
    });

    if (!chatExistOne && !chatExistTwo) {
      const newChat = new Chat(req.body);
      try {
        await newChat.save();
        const findNewChat = await Chat.findById(newChat._id);
        if (findNewChat) {
          try {
            const userOneFind = await User.findById(userOne);

            await userOneFind.updateOne({
              $push: { chats: newChat._id },
            });

            try {
              const userTwoFind = await User.findById(userTwo);
              await userTwoFind.updateOne({
                $push: { chats: newChat._id },
              });
              return res.status(200).json({
                ChatSave: true,
                chat: await Chat.findById(newChat._id),
                userOneUpdate: await User.findById(userOne),
                userTwoUpdate: await User.findById(userTwo),
              });
            } catch (error) {
              return res.status(404).json("Dont update userTwo");
            }
          } catch (error) {
            return res.status(404).json("Dont update userOne");
          }
        }
      } catch (error) {
        return res.status(404).json(error.message);
      }
    } else {
      return res.status(404).json({ ChatExist: true });
    }
  } catch (error) {
    return next(error);
  }
};

// //! -----------------------------------------------------------------------------
// //? -----------------------------CREATE NEW COMMENT -----------------------------
// //! -----------------------------------------------------------------------------
// //?------------------------------------------------------------------------------

const newComment = async (req, res, next) => {
  try {
    try {
      const commentBody = {
        commentContent: req.body.commentContent,
        owner: req.user._id,
        commentType: "Privado",
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
                try {
                  const userReal = await MountainRoute.findById(
                    req.body.referenceMountainRouteComment,
                  ).populate("owner");
                  await User.findByIdAndUpdate(userReal.owner._id, {
                    /*userReal.owner[0]._id,*/
                    $push: { commentsByOthers: newComment._id },
                  });

                  const userOne = req.user._id;
                  const userTwo = req.body.referenceUser
                    ? req.body.referenceUser
                    : userReal.owner._id; /*userReal.owner[0]._id;*/

                  const chatExistOne = await Chat.findOne({
                    userOne: req.user._id,
                    userTwo: req.body.referenceUser
                      ? req.body.referenceUser
                      : userReal.owner._id /*userReal.owner[0]._id,*/,
                  });

                  const chatExistTwo = await Chat.findOne({
                    userTwo: req.user._id,
                    userOne: req.body.referenceUser
                      ? req.body.referenceUser
                      : userReal.owner._id /*userReal.owner[0]._id,*/,
                  });

                  if (!chatExistOne && !chatExistTwo) {
                    const newChat = new Chat({ userOne, userTwo });
                    newChat.menssages = [newComment._id];
                    try {
                      await newChat.save();
                      const findNewChat = await Chat.findById(newChat._id);
                      if (findNewChat) {
                        try {
                          await User.findByIdAndUpdate(userOne, {
                            $push: { chats: newChat._id },
                          });

                          try {
                            await User.findByIdAndUpdate(userTwo, {
                              $push: { chats: newChat._id },
                            });
                            return res.status(200).json({
                              ChatSave: true,
                              chat: await Chat.findById(newChat._id),
                              userOneUpdate: await User.findById(userOne),
                              userTwoUpdate: await User.findById(userTwo),
                              newComment: await Comment.findById(
                                savedComment._id,
                              ),
                            });
                          } catch (error) {
                            return res.status(404).json("Dont update userTwo");
                          }
                        } catch (error) {
                          return res.status(404).json("Dont update userOne");
                        }
                      }
                    } catch (error) {
                      return res.status(404).json(error.message);
                    }
                  } else {
                    try {
                      await Chat.findByIdAndUpdate(
                        chatExistOne ? chatExistOne._id : chatExistTwo._id,
                        { $push: { menssages: newComment.id } },
                      );
                      return res.status(200).json({
                        ChatExist: true,
                        newComment: await Comment.findById(savedComment._id),
                        chatUpdate: await Chat.findById(
                          chatExistOne ? chatExistOne._id : chatExistTwo._id,
                        ),
                      });
                    } catch (error) {
                      return res.status(404).json("error update chat");
                    }
                  }
                } catch (error) {
                  return next(error);
                }
              } else if (req.body.referenceCityRouteComment) {
                await CityRoute.findByIdAndUpdate(
                  req.body.referenceCityRouteComment,
                  {
                    $push: { comments: newComment._id },
                  },
                );
                try {
                  const userReal = await CityRoute.findById(
                    req.body.referenceCityRouteComment,
                  ).populate("owner");
                  await User.findByIdAndUpdate(userReal.owner._id, {
                    /*userReal.owner[0]._id,*/
                    $push: { commentsByOthers: newComment._id },
                  });

                  const userOne = req.user._id;
                  const userTwo = req.body.referenceUser
                    ? req.body.referenceUser
                    : userReal.owner._id; /*userReal.owner[0]._id;*/

                  const chatExistOne = await Chat.findOne({
                    userOne: req.user._id,
                    userTwo: req.body.referenceUser
                      ? req.body.referenceUser
                      : userReal.owner._id /*userReal.owner[0]._id,*/,
                  });

                  const chatExistTwo = await Chat.findOne({
                    userTwo: req.user._id,
                    userOne: req.body.referenceUser
                      ? req.body.referenceUser
                      : userReal.owner._id /*userReal.owner[0]._id,*/,
                  });

                  if (!chatExistOne && !chatExistTwo) {
                    const newChat = new Chat({ userOne, userTwo });
                    newChat.menssages = [newComment._id];
                    try {
                      await newChat.save();
                      const findNewChat = await Chat.findById(newChat._id);
                      if (findNewChat) {
                        try {
                          await User.findByIdAndUpdate(userOne, {
                            $push: { chats: newChat._id },
                          });

                          try {
                            await User.findByIdAndUpdate(userTwo, {
                              $push: { chats: newChat._id },
                            });
                            return res.status(200).json({
                              ChatSave: true,
                              chat: await Chat.findById(newChat._id),
                              userOneUpdate: await User.findById(userOne),
                              userTwoUpdate: await User.findById(userTwo),
                              newComment: await Comment.findById(
                                savedComment._id,
                              ),
                            });
                          } catch (error) {
                            return res.status(404).json("Dont update userTwo");
                          }
                        } catch (error) {
                          return res.status(404).json("Dont update userOne");
                        }
                      }
                    } catch (error) {
                      return res.status(404).json(error.message);
                    }
                  } else {
                    try {
                      await Chat.findByIdAndUpdate(
                        chatExistOne ? chatExistOne._id : chatExistTwo._id,
                        { $push: { menssages: newComment.id } },
                      );
                      return res.status(200).json({
                        ChatExist: true,
                        newComment: await Comment.findById(savedComment._id),
                        chatUpdate: await Chat.findById(
                          chatExistOne ? chatExistOne._id : chatExistTwo._id,
                        ),
                      });
                    } catch (error) {
                      return res.status(404).json("error update chat");
                    }
                  }
                } catch (error) {
                  return next(error);
                }
              } else {
                try {
                  if (req.body.referenceUser) {
                    await User.findByIdAndUpdate(req.body.referenceUser, {
                      $push: { commentsByOthers: newComment._id },
                    });
                    try {
                      const userOne = req.user._id;
                      const userTwo = req.body.referenceUser;
                      // const userTwo = req.body.referenceUser
                      //   ? req.body.referenceUser
                      //   : userReal.owner[0]._id;

                      const chatExistOne = await Chat.findOne({
                        userOne,
                        userTwo,
                      });

                      const chatExistTwo = await Chat.findOne({
                        userOne: userTwo,
                        userTwo: userOne,
                      });

                      if (!chatExistOne && !chatExistTwo) {
                        const newChat = new Chat({ userOne, userTwo });
                        newChat.menssages.push(newComment._id);
                        try {
                          await newChat.save();
                          const findNewChat = await Chat.findById(newChat._id);
                          if (findNewChat) {
                            try {
                              await User.findByIdAndUpdate(userOne, {
                                $push: { chats: newChat._id },
                              });

                              try {
                                await User.findByIdAndUpdate(userTwo, {
                                  $push: { chats: newChat._id },
                                });
                                return res.status(200).json({
                                  ChatSave: true,
                                  chat: await Chat.findById(newChat._id),
                                  userOneUpdate: await User.findById(userOne),
                                  userTwoUpdate: await User.findById(userTwo),
                                  newComment: await Comment.findById(
                                    savedComment._id,
                                  ),
                                });
                              } catch (error) {
                                return res
                                  .status(404)
                                  .json("Dont update userTwo");
                              }
                            } catch (error) {
                              return res
                                .status(404)
                                .json("Dont update userOne");
                            }
                          }
                        } catch (error) {
                          return res.status(404).json(error.message);
                        }
                      } else {
                        try {
                          await Chat.findByIdAndUpdate(
                            chatExistOne ? chatExistOne._id : chatExistTwo._id,
                            { $push: { menssages: newComment.id } },
                          );
                          return res.status(200).json({
                            ChatExist: true,
                            newComment: await Comment.findById(
                              savedComment._id,
                            ),
                            chatUpdate: await Chat.findById(
                              chatExistOne
                                ? chatExistOne._id
                                : chatExistTwo._id,
                            ),
                          });
                        } catch (error) {
                          return res.status(404).json("error update chat");
                        }
                      }
                    } catch (error) {
                      return next(error);
                    }
                  }

                  //! ---------------------------------------------------------------------------------------
                  //! -------------------------------------------------------------------------------------

                  //! ---------------------------------------------------------------------------------------
                  //! -------------------------------------------------------------------------------------
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
      return res.status(500).json(error.message);
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createChat,
  newComment,
};
