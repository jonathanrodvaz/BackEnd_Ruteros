const UserSuccess = {
  SUCCESS_DELETING_USER: "Success deleting user",
  SUCCESS_CHANGING_USER_EMAIL: "Success changing user email",
};

const UserErrors = {
  FAIL_CREATING_USER: "Fail creating user",
  FAIL_UPDATING_USER: "Fail updating user",
  FAIL_UPDATING_HABILITIES: "Fail updating habilities",
  FAIL_UPDATING_RATINGS_BY_ME: "Fail updating ratings by me",
  FAIL_UPDATING_RATINGS_BY_OTHERS: "Fail updating ratings by others",
  FAIL_SEARCHING_USER: "Fail searching users",
  FAIL_SEARCHING_USER_BY_ID: "Fail searching user by Id",
  FAIL_SEARCHING_USER_BY_NAME: "Fail searching user by Name",
  FAIL_DELETING_USER: "Fail deleting user",
  FAIL_MATCHING_PASSWORDS: `Fail matching passwords`,
  FAIL_REGISTRERING_USER: `Fail registering user`,
  FAIL_CHANGING_USER_EMAIL: "Fail changing user email",
  FAIL_LOGIN_PASSWORD: "Wrong password, please try again",
  FAIL_LOGIN_EMAIL: "Wrong email address, please try again",
};

const CityRouteErrors = {
  FAIL_UPDATING_CITY_ROUTE: "Fail updating city route",
  FAIL_SEARCHING_CITY_ROUTE: "Fail searching city route",
  FAIL_SEARCHING_CITY_ROUTE_BY_ID: "Fail searching city route by ID",
  FAIL_SEARCHING_CITY_ROUTE_BY_NAME: "Fail searching city route by name",
};

const MountainRouteErrors = {
  FAIL_UPDATING_MOUNTAIN_ROUTE: "Fail updating mountain route",
  FAIL_SEARCHING_MOUNTAIN_ROUTE: "Fail searching mountain route",
  FAIL_SEARCHING_MOUNTAIN_ROUTE_BY_ID: "Fail searching mountain route by ID",
  FAIL_SEARCHING_MOUNTAIN_ROUTE_BY_NAME:
    "Fail searching mountain route by name",
};

const CommentErrors = {
  FAIL_UPDATING_COMMENT: "Error while updating the user comment",
  FAIL_CREATING_COMMENT:
    "There was an error while creating this comment, please try again",
  ERROR_SAVING_COMMENT:
    "There was an error while saving the comment. Please, try again.",
  FAIL_SEARCHING_COMMENTS: "Error while searching all the comments",
  FAIL_SEARCHING_COMMENT_BY_ID: "Error while searching this comment by ID",
  FAIL_DELETING_COMMENT: "Error while trying to delete this comment",
};
const CommentSuccess = {
  SUCCESS_DELETING_COMMENT: "Comment succesfully deleted from the database!",
};

const MobileDevErrors = {
  FAIL_CREATING_MOBILEDEV: "Fail creating mobile dev",
  FAIL_UPDATING_MOBILEDEV: "Fail updating mobile dev",
  FAIL_SEARCHING_MOBILEDEV: "Fail searching mobile dev",
  FAIL_SEARCHING_MOBILEDEV_BY_ID: "Fail searching mobile dev by Id",
  FAIL_SEARCHING_MOBILEDEV_BY_NAME: "Fail searching mobile dev by Name",
  FAIL_DELETING_MOBILEDEV: "Fail deleting mobile dev",
};

const MobileDevSuccess = {
  SUCCESS_DELETING_MOBILEDEV: "Success deleting mobile dev",
  SUCCESS_UPDATING_MOBILEDEV: "Success updating mobile dev", //Añadida recientemente por J
};

const AppErrors = {
  FAIL_UPDATING_APP: "Fail updating app",
  FAIL_CREATING_APP: "Fail creating app",
  FAIL_SEARCHING_APP: "Fail searchinng app",
  FAIL_SEARCHING_APP_BY_ID: "Fail searching app by Id",
  FAIL_SEARCHING_APP_BY_NAME: "Fail searching app by AppName",
  FAIL_DELETING_APP: "Fail deleting app",
  FAIL_DELETING_APP_TEST: "Fail deleting app at test",
};

const AppSuccess = {
  SUCCESS_UPDATING_APP: "Success updating app",
  SUCCESS_DELETING_APP: "Success deleting app",
};

module.exports.UserSuccess = UserSuccess;
module.exports.UserErrors = UserErrors;
module.exports.CityRouteErrors = CityRouteErrors;
module.exports.MountainRouteErrors = MountainRouteErrors;
module.exports.MobileDevErrors = MobileDevErrors;
module.exports.MobileDevSuccess = MobileDevSuccess;
module.exports.AppErrors = AppErrors;
module.exports.AppSuccess = AppSuccess;
module.exports.CommentErrors = CommentErrors;
module.exports.CommentSuccess = CommentSuccess;
