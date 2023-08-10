const { deleteImgCloudinary } = require("../../middleware/files.middleware");
const randomCode = require("../../utils/randomCode");
//const sendConfirmationCodeByEmail = require("../../utils/sendConfirmationCodeByEmail");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const User = require("../models/user.model");
//const { getTestEmailSend } = require("../../state/state.data");
const nodemailer = require("nodemailer");
const { generateToken } = require("../../utils/token");
const randomPassword = require("../../utils/randomPassword");
const { UserErrors, UserSuccess } = require("../../helpers/jsonResponseMsgs");
const { setError } = require("../../helpers/handle-error");

const Ratings = require("../models/ratings.model");
const Experience = require("../models/experience.model");
const Comment = require("../models/comment.model");

const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;
const BASE_URL_COMPLETE = `${BASE_URL}${PORT}`;

//! -----------------------------------------------------------------------------
//? ----------------------------REGISTER LARGO EN CODIGO ------------------------
//! -----------------------------------------------------------------------------
const registerSlow = async (req, res, next) => {
  await User.syncIndexes();
  try {
    let confirmationCode = randomCode();
    const userEmail = req.body.email;
    const userName = req.body.name;

    const userExist = await User.findOne(
      { email: userEmail },
      { name: userName },
    );

    if (!userExist) {
      const newUser = new User({ ...req.body, confirmationCode });

      if (req.files) {
        newUser.image = req.files[0].path;
        const fileUrls = req.files.map((file) => file.path);

        newUser.images = fileUrls;
      } else {
        newUser.image = "https://pic.onlinewebfonts.com/svg/img_181369.png";
      }

      // if (req.file) {
      //   newUser.image = req.file.path;
      // } else {
      //   newUser.image = "https://pic.onlinewebfonts.com/svg/img_181369.png";
      // }

      try {
        const userSave = await newUser.save();

        if (userSave) {
          const nodemailer_email = process.env.NODEMAILER_EMAIL;
          const nodemailer_password = process.env.NODEMAILER_PASSWORD;

          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: nodemailer_email,
              pass: nodemailer_password,
            },
          });

          const mailOptions = {
            from: nodemailer_email,
            to: userEmail,
            subject: "Confirmation code",
            text: `Hola! Tu codigo es ${confirmationCode}, gracias por confiar en nosotros ${userName}`,
          };

          transporter.sendMail(mailOptions, function (error) {
            if (error) {
              console.log("send mail error, error: ", error);

              return res.status(404).json({
                user: userSave,
                confirmationCode: "Error, resend code",
              });
            } else {
              console.log("send mail ok,: ");

              return res.status(200).json({
                user: userSave,
                confirmationCode,
              });
            }
          });
        }
      } catch (error) {
        return res.status(404).json("failed saving user");
      }
    } else {
      if (req.files) {
        req.files.map((image) => deleteImgCloudinary(image.path));
      }
      return res.status(409).json("This user already exist");
    }
  } catch (error) {
    if (req.files) {
      req.files.map((image) => deleteImgCloudinary(image.path));
    }
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? ------------------ CONTRALADORES QUE PUEDEN SER REDIRECT --------------------
//! ----------------------------------------------------------------------------

//!!! los controladores redirect son aquellos que son llamados por parte del
//!!! cliente (los routers) o bien por otros controladores

const sendCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userDB = await User.findById(id);

    const emailEnv = process.env.NODEMAILER_EMAIL;
    const password = process.env.NODEMAILER_PASSWORD;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailEnv,
        pass: password,
      },
    });

    const mailOptions = {
      from: emailEnv,
      to: userDB.email,
      subject: "Confirmation code",
      text: `Hola! Tu codigo es ${userDB.confirmationCode}, gracias por confiar en nosotros ${userDB.name}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(404).json({
          user: userDB,
          confirmationCode: "Error, resend code",
        });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({
          user: userDB,
          confirmationCode: userDB.confirmationCode,
        });
      }
    });
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? --------------------------------LOGIN ---------------------------------------
//! -----------------------------------------------------------------------------

const login = async (req, res, next) => {
  try {
    const userEmail = req.body.email;
    const userPassword = req.body.password;

    const userDB = await User.findOne({ email: userEmail });

    console.log("User email: ", userEmail);
    console.log("userDB: ", userDB);
    console.log("User password: ", userPassword);

    if (userDB) {
      if (bcrypt.compareSync(userPassword, userDB.password)) {
        const token = generateToken(userDB._id, userEmail);
        return res.status(200).json({
          user: userDB,
          token,
        });
      } else {
        return res.status(404).json(UserErrors.FAIL_LOGIN_PASSWORD); //Contraseña equivocada
      }
    } else {
      return res.status(404).json(UserErrors.FAIL_LOGIN_EMAIL); //User not found/mail not found
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? -----------------------CONTRASEÑAS Y SUS CAMBIOS-----------------------------
//! -----------------------------------------------------------------------------

//? -----------------------------------------------------------------------------
//! ------------------CAMBIO DE CONTRASEÑA CUANDO NO ESTAS LOGADO---------------
//? -----------------------------------------------------------------------------

const changeForgottenPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // si el usuario existe entonces hacemos el redirect para
    const userDb = await User.findOne({ email });
    if (userDb) {
      return res.redirect(
        307,
        `${BASE_URL_COMPLETE}/api/v1/users/sendPassword/${userDb._id}`,
      );
    } else {
      return res.status(404).json("User no register");
    }
  } catch (error) {
    return next(error);
  }
};

const sendPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userDb = await User.findById(id);
    // configuramos el transporte de nodemailer
    const email = process.env.NODEMAILER_EMAIL;
    const password = process.env.NODEMAILER_PASSWORD;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: password,
      },
    });

    // Generamos la password secura con la funcion randomPassword
    let passwordSecure = randomPassword();
    console.log(passwordSecure);
    const mailOptions = {
      from: email,
      to: userDb.email,
      subject: "-----",
      text: `User: ${userDb.name}. Your new code login is ${passwordSecure} Hemos enviado esto porque tenemos una solicitud de cambio de contraseña, si no has sido ponte en contacto con nosotros, gracias.`,
    };

    // enviamos el email
    transporter.sendMail(mailOptions, async function (error, info) {
      if (error) {
        // si hay error quiere decir que ni hemos actualizado el user, ni enviamos email
        console.log("error Nodemailer: ", error);
        return res.status(404).json("dont send email and dont update user");
      } else {
        console.log("Email sent: " + info.response);
        // ----> si hemos enviado el correo, hasheamos la contraseña y actualizamos el user
        const newPasswordBcrypt = bcrypt.hashSync(passwordSecure, 10);
        try {
          // actualizamos la contraseña en el back
          await User.findByIdAndUpdate(id, { password: newPasswordBcrypt });
          const userUpdatePassword = await User.findById(id);
          /// comprobamos que se haya actualizado correctamente
          if (bcrypt.compareSync(passwordSecure, userUpdatePassword.password)) {
            return res.status(200).json({
              updateUser: true,
              sendPassword: true,
            });
          } else {
            // si no se ha actualizado damos feedback de que se envio la contraseña pero
            // ... no se actualizo
            return res.status(404).json({
              updateUser: false,
              sendPassword: true,
            });
          }
        } catch (error) {
          return res.status(404).json(error.message);
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

//? -----------------------------------------------------------------------------
//! ------------------CAMBIO DE CONTRASEÑA CUANDO YA SE ESTA LOGEADO---------------
//? -----------------------------------------------------------------------------

const changePassword = async (req, res, next) => {
  await User.syncIndexes();
  try {
    const { password, newPassword } = req.body;

    const { _id } = req.user;

    if (bcrypt.compareSync(password, req.user.password)) {
      const newPasswordHashed = bcrypt.hashSync(newPassword, 10);

      try {
        await User.findByIdAndUpdate(_id, { password: newPasswordHashed });

        const userUpdate = await User.findById(_id);

        if (bcrypt.compareSync(newPassword, userUpdate.password)) {
          return res.status(200).json({
            updateUser: true,
          });
        } else {
          return res.status(200).json({
            updateUser: false,
          });
        }
      } catch (error) {
        return res.status(404).json("failed updating password");
      }
    } else {
      return res.status(404).json(UserErrors.FAIL_MATCHING_PASSWORDS);
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? ---------------------------------UPDATE-------------------------------------- // AQUÍ
//! -----------------------------------------------------------------------------
const update = async (req, res, next) => {
  await User.syncIndexes();
  // let catchImg = req.file?.path;
  const { name, surname, description, city, image } = req.body;
  // hacer un update especial para las tecnologias y un controlador para seguir a la gente

  try {
    const filterBody = {
      name,
      surname,
      description,
      city,
      image,
    };
    const patchUser = new User(filterBody);

    if (req.file) {
      patchUser.image = req.file.path;
    }

    patchUser._id = req.user._id;
    patchUser.password = req.user.password;
    patchUser.rol = req.user.rol;
    patchUser.email = req.user.email;
    patchUser.check = req.user.check;
    patchUser.confirmationCode = req.user.confirmationCode;
    patchUser.emailChange = req.user.emailChange;
    patchUser.habilities = req.user.habilities;
    patchUser.commentsByMe = req.user.commentsByMe;

    patchUser.commentsByOthers = req.user.commentsByOthers;
    patchUser.ratingsByMe = req.user.ratingsByMe;
    patchUser.ratingsByOthers = req.user.ratingsByOthers;
    patchUser.experience = req.user.experience;

    patchUser.banned = req.user.banned;
    patchUser.following = req.user.following;
    patchUser.followers = req.user.followers;
    patchUser.comentsThatILike = req.user.comentsThatILike;

    try {
      await User.findByIdAndUpdate(req.user._id, patchUser);

      if (req.file) {
        deleteImgCloudinary(req.user.image);
      }

      const updateUser = await User.findById(req.user._id);
      const updateKeys = Object.keys(req.body);

      const testUpdate = [];
      updateKeys.forEach((key) => {
        if (updateUser[key] === req.body[key]) {
          testUpdate.push({
            [key]: true,
          });
        }
      });

      if (req.file) {
        updateUser.image == req.file.path
          ? testUpdate.push({
              file: true,
            })
          : testUpdate.push({
              file: false,
            });
      }

      return res.status(200).json({
        testUpdate,
      });
    } catch (error) {
      return res.status(404).json("failed updating user");
    }
  } catch (error) {
    // if (catchImg) deleteImgCloudinary(catchImg);
    return next(error);
  }
};

const updateHabilities = async (req, res, next) => {
  await User.syncIndexes();
  try {
    const { _id } = req.user;
    const customBody = {
      habilities: req.body.habilities,
    };

    const oldUser = await User.findByIdAndUpdate(_id, customBody);
    if (oldUser) {
      return res.status(200).json({
        oldUser: oldUser,
        newUser: await User.findById(_id),
        status: "Succesfully habilities updated!",
      });
    } else {
      return res.status(404).json(UserErrors.FAIL_UPDATING_HABILITIES);
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? ----------------------------- DELETE ----------------------------------------
//! -----------------------------------------------------------------------------
//?------------------------------------------------------------------------------
//!--------INCOMPLETO--INCOMPLETO--INCOMPLETO--INCOMPLETO--INCOMPLETO------------
//?------------------------------------------------------------------------------
//!-Revisar en el excalidraw las funcionalidades adicionales que este delete debe tener
//?------------------------------------------------------------------------------------

const deleteUser = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const deleteUser = await User.findByIdAndDelete(_id);

    if (deleteUser) {
      if (await User.findById(_id)) {
        return res.status(404).json(UserErrors.FAIL_DELETING_USER);
      } else {
        // deleteImgCloudinary(image);

        if (deleteUser.images) {
          deleteUser.images.map((image) => deleteImgCloudinary(image));
        }

        await Ratings.updateMany(
          { users: _id },
          {
            $pull: { users: _id },
          },
        );

        // await Offer.updateMany(
        //   { users: _id },
        //   {
        //     $pull: { users: _id },
        //   },
        // );

        await Experience.updateMany(
          { users: _id },
          {
            $pull: { users: _id },
          },
        );

        await Comment.updateMany(
          { users: _id },
          {
            $pull: { users: _id },
          },
        );

        return res.status(200).json(UserSuccess.SUCCESS_DELETING_USER);
      }
    }
  } catch (error) {
    // deleteImgCloudinary(req.user.image);
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ------------------------------GETALL --------------------------------
//! ---------------------------------------------------------------------
const getAll = async (req, res, next) => {
  try {
    const allUsers = await User.find().populate(
      "habilities mountainRoutesCreated cityRoutesCreated mountainRoutesInterested cityRoutesInterested commentsByMe commentsByOthers ratingsByMe ratingsByOthers experience following followers comentsThatILike",
    );
    if (allUsers) {
      return res.status(200).json(allUsers);
    } else {
      return res.status(404).json("No users found");
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

    const userById = await User.findById(id)
      .populate(
        "habilities mountainRoutesInterested cityRoutesInterested commentsByMe commentsByOthers ratingsByMe ratingsByOthers experience following followers comentsThatILike",
      )
      .populate({
        path: "mountainRoutesCreated",
        populate: { path: "comments" },
      })
      .populate({ path: "cityRoutesCreated", populate: { path: "comments" } })
      .populate({
        path: "chats",
        populate: {
          path: "menssages",
          populate: { path: "owner" },
        },
      })
      .populate({
        path: "chats",
        populate: {
          path: "userOne",
        },
      })
      .populate({
        path: "chats",
        populate: {
          path: "userTwo",
        },
      });

    if (userById) {
      return res.status(200).json(userById);
    } else {
      return res.status(404).json("No user found");
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ------------------------------GET BY TOKEN --------------------------
//! ---------------------------------------------------------------------
const getByToken = async (req, res, next) => {
  try {
    // const userByToken = await User.findById(req.user._id).populate(
    //   "habilities offersCreated offersInterested commentsByMe commentsByOthers ratingsByMe ratingsByOthers experience following followers comentsThatILike",
    // );
    const userByToken = await User.findById(req.user._id).populate(
      "habilities  commentsByMe commentsByOthers ratingsByMe ratingsByOthers experience following followers comentsThatILike",
    );
    if (userByToken) {
      return res.status(200).json(userByToken);
    } else {
      return res.status(404).json("No user found");
    }
  } catch (error) {
    return next(error);
  }
};

//! ------------------------------------------------------------------------
//? -------------------------- CHECK NEW USER------------------------------
//! ------------------------------------------------------------------------

const checkNewUser = async (req, res, next) => {
  try {
    const { email, confirmationCode } = req.body;
    const userExists = await User.findOne({ email });
    if (!userExists) {
      return res.status(404).json(UserErrors.FAIL_SEARCHING_USER);
    } else {
      // cogemos que comparamos que el codigo que recibimos por la req.body y el del userExists es igual
      if (confirmationCode === userExists.confirmationCode) {
        // si es igual actualizamos la propiedad check y la ponemos a true
        await userExists.updateOne({ check: true });
        // hacemos un testeo de que este user se ha actualizado correctamente, hacemos un findOne
        const updateUser = await User.findOne({ email });

        // este finOne nos sirve para hacer un ternario que nos diga si la propiedad vale true o false
        return res.status(200).json({
          testCheckOk: updateUser.check == true ? true : false,
        });
      } else {
        /// En caso dec equivocarse con el codigo lo borramos de la base datos y lo mandamos al registro
        await User.findByIdAndDelete(userExists._id);

        // borramos la imagen
        deleteImgCloudinary(userExists.image);

        // devolvemos un 200 con el test de ver si el delete se ha hecho correctamente
        return res.status(200).json({
          userExists,
          check: false,
          delete: (await User.findById(userExists._id))
            ? UserErrors.FAIL_DELETING_USER
            : UserSuccess.SUCCESS_DELETING_USER,
        });
      }
    }
  } catch (error) {
    // siempre en el catch devolvemos un 500 con el error general
    return next(setError(500, "General error, check code"));
  }
};

//! ------------------------------------------------------------------------
//? ------------CHANGE EMAIL y CONFIRMATION OF CHANGED EMAIL----------------
//! ------------------------------------------------------------------------

const changeEmail = async (req, res, next) => {
  try {
    await User.syncIndexes();
    let confirmationCode = randomCode();
    const { newEmail } = req.body;

    if (req.user && req.user.email != newEmail) {
      console.log("antes", req.user.email);
      await User.findByIdAndUpdate(req.user._id, {
        emailChange: newEmail,
        check: false,
        confirmationCode: confirmationCode,
      });

      return res.redirect(
        `${BASE_URL_COMPLETE}/api/v1/users/sendNewCode/${req.user._id}`,
      );
    } else {
      return res.status(404).json("Debe meter un email distinto al anterior");
    }
  } catch (error) {
    return next(error);
  }
};
const sendNewCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userDB = await User.findById(id);
    const nodemailerEmail = process.env.NODEMAILER_EMAIL;
    const nodemailerPassword = process.env.NODEMAILER_PASSWORD;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: nodemailerEmail,
        pass: nodemailerPassword,
      },
    });

    const mailOptions = {
      from: nodemailerEmail,
      to: userDB.emailChange,
      subject: "Confirmation code email change",
      text: `${userDB.name} you requested an email change, please insert the following confirmation code: ${userDB.confirmationCode} `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(mailOptions);
        return res.status(404).json({
          user: userDB,
          confirmationCode: UserErrors.FAIL_CHANGING_USER_EMAIL,
        });
      } else {
        console.log("email sent: " + info.response);
        return res.status(200).json({
          email: UserSuccess.SUCCESS_CHANGING_USER_EMAIL,
          user: userDB,
          confirmationCode: userDB.confirmationCode,
        });
      }
    });
  } catch (error) {
    return next(error);
  }
};

//! ------------------------------------------------------------------------
//? -------------------------- VERIFY NEW EMAIL------------------------------
//! ------------------------------------------------------------------------

// const verifyNewEmail = async (req, res, next) => {
//   try {
//     const { email, confirmationCode, emailChange } = req.body;
//     console.log("verifyNewEmail: => ", req.body);
//     const userExists = await User.findOne({ email });
//     console.log("userExists: => ", userExists);
//     if (!userExists) {
//       return res.status(404).json(UserErrors.FAIL_SEARCHING_USER);
//     } else {
//       if (confirmationCode === userExists.confirmationCode) {
//         if (emailChange !== email) {
//           try {
//             await userExists.updateOne({
//               check: true,
//               email: emailChange,
//               emailChange: emailChange,
//             });
//             const updateUser = await User.findOne({ email: emailChange });
//             return res.status(200).json({
//               testCheckOk: updateUser.check == true ? true : false,
//             });
//           } catch (error) {
//             return res.status(404).json("failed updating email");
//           }
//         } else {
//           return res
//             .status(400)
//             .json(
//               "El correo electrónico nuevo debe ser diferente al correo electrónico actual"
//             );
//         }
//       } else {
//         return res.status(404).json("email don't match");
//       }
//     }
//   } catch (error) {
//     return next(setError(500, "General error, check code"));
//   }
// };

//! ------------------------------------------------------------------------
//? -------------------------- VERIFY NEW EMAIL PRUEBA------------------------------
//! ------------------------------------------------------------------------
const verifyNewEmail = async (req, res, next) => {
  try {
    const { confirmationCode } = req.body;

    const userExists = await User.findOne({ confirmationCode });

    if (!userExists) {
      return res.status(404).json(UserErrors.FAIL_SEARCHING_USER);
    } else {
      if (
        userExists.emailChange &&
        userExists.emailChange !== userExists.email
      ) {
        try {
          await userExists.updateOne({
            check: true,
            email: userExists.emailChange,
            emailChange: userExists.emailChange,
          });
          const updateUser = await User.findOne({
            email: userExists.emailChange,
          });
          return res.status(200).json({
            testCheckOk: updateUser.check == true ? true : false,
          });
        } catch (error) {
          return res.status(404).json("failed updating email");
        }
      } else {
        return res
          .status(400)
          .json(
            "El correo electrónico nuevo debe ser diferente al correo electrónico actual",
          );
      }
    }
  } catch (error) {
    return next(setError(500, "General error, check code"));
  }
};

//! ------------------------------------------------------------------------
//? -------------------------- AUTOLOGIN ------------------------------
//! ------------------------------------------------------------------------

const autoLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userDB = await User.findOne({ email });

    if (userDB) {
      if ((password, userDB.password)) {
        const token = generateToken(userDB._id, email);
        return res.status(200).json({
          user: userDB,
          token,
        });
      } else {
        return res.status(404).json("password dont match");
      }
    } else {
      return res.status(404).json("User no register");
    }
  } catch (error) {
    return next(error);
  }
};

//! ------------------------------------------------------------------------
//? -------------------------- RESEND CODE ------------------------------
//! ------------------------------------------------------------------------

const resendCode = async (req, res, next) => {
  try {
    //! vamos a configurar nodemailer porque tenemos que enviar un codigo
    const email = process.env.NODEMAILER_EMAIL;
    const password = process.env.NODEMAILER_PASSWORD;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: email,
        pass: password,
      },
    });
    //! hay que ver que el usuario exista porque si no existe no tiene sentido hacer ninguna verificacion
    const userExists = await User.findOne({ email: req.body.email });

    if (userExists) {
      const mailOptions = {
        from: email,
        to: req.body.email,
        subject: "Confirmation code",
        text: `tu codigo es ${userExists.confirmationCode}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
          return res.status(200).json({
            resend: true,
          });
        }
      });
    } else {
      return res.status(404).json("User not found");
    }
  } catch (error) {
    return next(setError(500, error.message || "Error general send code"));
  }
};

//! -----------------------------------------------------------------------------
//? --------------------------------- BANNED ------------------------------------
//! -----------------------------------------------------------------------------

const banned = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const oldUser = await User.findOne(_id, req.body);
    if (!oldUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (oldUser.banned === true) {
      oldUser.banned = false;
    } else {
      oldUser.banned = true;
    }
    const updatedUser = await oldUser.save();
    return res.status(200).json({
      oldUser: oldUser,
      updatedUser: updatedUser,
      status: "Successfully banned",
    });
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? --------------------------------- FOLLOWING/FOLLOWERS -----------------------
//! -----------------------------------------------------------------------------
const following = async (req, res, next) => {
  try {
    // ID del usuario a seguir por parte del usuario logueado.
    const { id } = req.params;

    // ID del usuario logueado.
    const { _id } = req.user._id;

    const logedUser = await User.findById(_id);

    if (!logedUser) {
      return res.status(404).json({ error: "Loged user not found" });
    }

    const userToFollow = await User.findById(id);

    if (!userToFollow) {
      return res
        .status(404)
        .json({ error: "User to follow by loged user not found" });
    }

    ///---------------------------------------------

    const isUserInFollowingArr = logedUser.following.find(
      (user) => user._id.toString() === id,
    );

    if (isUserInFollowingArr === undefined) {
      // El usuario a seguir no está en el array 'following', por lo tanto lo insertamos en el array.
      logedUser.following.push(id);
    } else {
      // El usuario a seguir está en el array 'following', por lo tanto lo eliminamos del array.
      logedUser.following = logedUser.following.filter(
        (user) => user._id.toString() !== id,
      );
    }

    await logedUser.save();

    //-----------------------------------------------------------------

    const isUserInFollowersArr = userToFollow.followers.find(
      (user) => user._id.toString() === _id.toString(),
    );

    if (isUserInFollowersArr === undefined) {
      // El usuario a seguir no está en el array 'followers', por lo tanto lo insertamos.
      userToFollow.followers.push(_id.toString());
    } else {
      console.log("user in followers array");

      // El usuario a seguir está en el array 'followers', por lo tanto lo eliminamos del array.
      userToFollow.followers = userToFollow.followers.filter(
        (user) => user._id.toString() !== _id.toString(),
      );
    }

    await userToFollow.save();

    // -------------------------------------------------------------

    return res.status(200).json({
      status: "Success updating following -- Followers",
    });
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? --------------------------------- GET FOLLOWING STATUS -------------------------
//! -----------------------------------------------------------------------------
const getFollowingStatus = async (req, res, next) => {
  try {
    // ID del usuario a seguir por parte del usuario logueado.
    const { id } = req.params;

    // ID del usuario logueado.
    const { _id } = req.user._id;

    const logedUser = await User.findById(_id);

    if (!logedUser) {
      return res.status(404).json({ error: "Loged user not found" });
    }

    const userToFollow = await User.findById(id);

    if (!userToFollow) {
      return res
        .status(404)
        .json({ error: "User to follow by loged user not found" });
    }

    const isUserInFollowingArr = logedUser.following.find(
      (user) => user._id.toString() === id,
    );

    if (isUserInFollowingArr === undefined) {
      // El usuario a seguir no está en el array 'following', por lo tanto lo insertamos en el array.
      return res.status(200).json({
        status: "user is Not in following arr",
      });
    } else {
      // El usuario a seguir está en el array 'following', por lo tanto lo eliminamos del array.
      return res.status(200).json({
        status: "user is in following arr",
      });
    }
  } catch (error) {
    return next(error);
  }
};

//! -----------------------------------------------------------------------------
//? --------------------------------- UPDATE CHANGE ROL -------------------------
//! -----------------------------------------------------------------------------

const updateUserRol = async (req, res, next) => {
  try {
    const { id, rol } = req.body;

    if (!["admin", "freelance", "company"].includes(rol)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Obtener el usuario a actualizar

    const user = await User.findByIdAndUpdate(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verificar si el usuario tiene el rol de administrador

    if (req.user.rol !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can update user roles" });
    }

    // Actulización y guadado del nuevo rol en el usuario

    user.rol = rol;
    await user.save();

    return res.status(200).json({ message: "User role updated successfully" });
  } catch (error) {
    next(error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerSlow,
  sendCode,
  login,
  changeForgottenPassword,
  sendPassword,
  changePassword,
  update,
  updateHabilities,
  deleteUser,
  getAll,
  getById,
  getByToken,
  checkNewUser,
  changeEmail,
  sendNewCode,
  verifyNewEmail,
  autoLogin,
  resendCode,
  banned,
  following,
  getFollowingStatus,
  updateUserRol,
};
