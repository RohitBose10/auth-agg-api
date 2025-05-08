const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    otp: { type: Number, required: true },
    profileImage: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    }, // Add the role field
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// generating a hash
UserSchema.methods.generateHash = async (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = async (password, checkPassword) => {
  return bcrypt.compareSync(password, checkPassword);
};

module.exports = mongoose.model("User", UserSchema);
