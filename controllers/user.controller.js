const User = require("../models/user.model");
const Mailer = require("../helper/mailer");
const jwt = require("jsonwebtoken");
class UserWebserviceController {
  async signup(req, res) {
    try {
      // Validate if email is provided
      if (!req.body.email) {
        return res.status(400).send({
          status: 400,
          data: {},
          message: "Email is required",
        });
      }

      // Validate if password is provided
      if (!req.body.password) {
        return res.status(400).send({
          status: 400,
          data: {},
          message: "Password is required",
        });
      }

      // Check if email already exists
      let isEmailExists = await User.find({
        email: req.body.email,
        isDeleted: false,
      });

      if (isEmailExists.length > 0) {
        return res.status(400).send({
          status: 400,
          data: {},
          message: "Email is already taken",
        });
      }

      req.body.password = await new User().generateHash(req.body.password);

      let otp = Math.floor(Math.random() * 9000) + 1000;
      req.body.otp = otp;
      let userObj = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        otp: req.body.otp,
        role: req.body.role,
        profileImage: req.file.filename,
      };
      
      let saveUser = await User.create(userObj);
      console.log(saveUser, "saveUser");
      if (saveUser) {
        const mailer = new Mailer(
          "Gmail",
          process.env.APP_EMAIL,
          process.env.APP_PASSWORD
        );

        let mailObj = {
          to: req.body.email,
          subject: "Email Verification",
          text: `Your OTP for email verification is ${otp}.`,
        };

        mailer.sendMail(mailObj);

        // Use find to query the saved user and exclude fields
        let userWithoutSensitiveData = await User.findById(saveUser._id).select(
          "-password -_id -isDeleted -createdAt -updatedAt"
        );

        return res.status(200).send({
          status: 200,
          data: userWithoutSensitiveData,
          message: "Registration successfully completed!",
        });
      } else {
        return res.status(400).send({
          status: 400,
          data: {},
          message: "Something went wrong during registration",
        });
      }
    } catch (err) {
      return res.status(500).send({
        status: 500,
        data: {},
        message: err,
      });
    }
  }

  async verifyEmail(req, res) {
    try {
      let { email, otp } = req.body;
      let user = await User.find({ email });
      if (user.length > 0) {
        if (user[0].otp == otp) {
          await User.updateOne({ email }, { otp: null });
          return res.json({
            status: 200,
            message: "Email verified successfully",
            data: {},
          });
        } else {
          return res.json({
            status: 400,
            message: "Invalid OTP",
            data: {},
          });
        }
      } else {
        return res.json({
          status: 400,
          message: "User not found",
        });
      }
    } catch (error) {
      return res.json({
        status: 500,
        message: error.message,
        data: {},
      });
    }
  }
  async signin(req, res) {
    try {
      //only sign in if there is no otp in the user details
      let user = await User.find({
        email: req.body.email,
        isDeleted: false,
      });
      if (user.length > 0) {
        if (user[0].otp) {
          return res.status(400).send({
            status: 400,
            data: {},
            message: "Please verify your email first",
          });
        }
      }
      // Validate if email is provided
      if (!req.body.email) {
        return res.status(400).send({
          status: 400,
          data: {},
          message: "Email is required",
        });
      }
      // Validate if password is provided
      if (!req.body.password) {
        return res.status(400).send({
          status: 400,
          data: {},
          message: "Password is required",
        });
      }

      req.body.email = req.body.email.trim().toLowerCase();
      let userData = await User.find({
        email: req.body.email,
        isDeleted: false,
      });
      if (userData.length > 0) {
        const isPasswordValid = await new User().validPassword(
          req.body.password,
          userData[0].password
        ); //1st param is for req.body.password and 2nd param is from userdetaisls

        if (isPasswordValid) {
          let user = userData[0];

          const payload = {
            id: user._id,
          };

          let token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1D", // token expiration time
          });

          req.user = user;

          // Use find to query the saved user and exclude fields
          let userWithoutSensitiveData = await User.findById(user._id).select(
            "-password -_id -isDeleted -createdAt -updatedAt"
          );

          return res.status(200).send({
            status: 200,
            data: userWithoutSensitiveData,
            token,
            message: "Signin successfully completed!",
          });
        } else {
          return res.status(401).send({
            status: 401,
            data: {},
            message: "Authentication failed. You are not a valid user.",
          });
        }
      } else {
        return res.status(401).send({
          status: 401,
          data: {},
          message: "Authentication failed. You are not a valid user.",
        });
      }
    } catch (err) {
      return res.status(500).send({
        status: 500,
        data: {},
        message: err,
      });
    }
  }

  async profileDetails(req, res) {
    try {
      const user = req.user; // Access user details set by `auth.authenticate`

      let userWithoutSensitiveData = await User.findById(user._id).select(
        "-password -_id -isDeleted -otp -createdAt -updatedAt"
      );

      return res.status(200).send({
        status: 200,
        data: userWithoutSensitiveData,
        message: "User profile details fetched successfully!",
      });
    } catch (err) {
      return res.status(500).send({
        status: 500,
        data: {},
        message: err,
      });
    }
  }
  async editProfile(req, res) {
    try {
      const user = req.user; // user from token
  
      // Check if user exists
      let existingUser = await User.findOne({ _id: user._id, isDeleted: false });
  
      if (!existingUser) {
        return res.status(404).send({
          status: 404,
          data: {},
          message: "User not found",
        });
      }
  
      let updateData = {};
  
      // If firstName is provided
      if (req.body.firstName) {
        updateData.firstName = req.body.firstName.trim();
      }
  
      // If lastName is provided
      if (req.body.lastName) {
        updateData.lastName = req.body.lastName.trim();
      }
  
      // If email is provided (Ensure you are not updating email if not allowed)
      if (req.body.email && req.body.email !== existingUser.email) {
        // Optionally, check if email already exists
        let emailExists = await User.findOne({ email: req.body.email, isDeleted: false });
        if (emailExists) {
          return res.status(400).send({
            status: 400,
            data: {},
            message: "Email is already taken",
          });
        }
        updateData.email = req.body.email.trim();
      }
  
      // If profile image is provided
      if (req.file) {
        updateData.profileImage = req.file.filename;
      }
  
      // If no update data found
      if (Object.keys(updateData).length === 0) {
        return res.status(400).send({
          status: 400,
          data: {},
          message: "No data provided to update",
        });
      }
  
      // Update the user
      let updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: updateData },
        { new: true }
      ).select("-password -_id -isDeleted -otp -createdAt -updatedAt");
  
      return res.status(200).send({
        status: 200,
        data: updatedUser,
        message: "Profile updated successfully!",
      });
  
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        status: 500,
        data: {},
        message: err.message,
      });
    }
  }
  
  
}

module.exports = new UserWebserviceController();
