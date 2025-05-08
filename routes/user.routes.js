const router = require("express").Router();
const userWebServices = require("../controllers/user.controller");
const FileUploader = require("../helper/fileUpload");
const auth = require("../middlewares/auth")();

// File uploader configuration
const fileUploader = new FileUploader({
  folderName: "uploads/profile-images",          // Custom folder for uploads
  supportedFiles: ["image/png", "image/jpg", "image/jpeg"], // Supported image types
  fieldSize: 1024 * 1024 * 5                      // Max file size: 5MB
});

// User registration (with optional profile image upload)
router.post(
  "/user/signup",
  fileUploader.upload().single("profileImage"),
  userWebServices.signup
);

// Email verification
router.post("/user/verifyEmail", userWebServices.verifyEmail);

// User login
router.post("/user/signin", userWebServices.signin);

// Fetch user profile (requires authentication)
router.get(
  "/user/profile",
  auth.authenticateAPI,
  userWebServices.profileDetails
);

// Edit profile (with optional profile image upload)
router.put(
  "/user/editProfile",
  auth.authenticateAPI,
  fileUploader.upload().single("profileImage"),
  userWebServices.editProfile
);

// Forgot password
router.post("/user/forgotPassword", userWebServices.forgotPassword);

// Reset password using token
router.post("/user/resetPassword/:token", userWebServices.resetPassword);

module.exports = router;
