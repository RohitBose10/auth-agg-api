const router = require('express').Router();
const userWebServices = require('../controllers/user.controller');
const FileUploader = require('../helper/fileUpload');
const auth = require("../middlewares/auth")()



const fileUploader = new FileUploader({
    folderName: 'uploads/profile-images',  // Custom folder for uploads
    supportedFiles: ['image/png', 'image/jpg', 'image/jpeg'],  // Supported file types
    fieldSize: 1024 * 1024 * 5,  // Max file size (5MB)
});



router.post('/user/signup',fileUploader.upload().single('profileImage'), userWebServices.signup);
router.post('/user/verifyEmail', userWebServices.verifyEmail);
router.post('/user/signin', userWebServices.signin);
router.get('/user/profile', auth.authenticateAPI, userWebServices.profileDetails);
router.put('/user/editProfile', auth.authenticateAPI, fileUploader.upload().single('profileImage'), userWebServices.editProfile);


module.exports = router;