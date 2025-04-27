const passport = require("passport");
const passportJWT = require("passport-jwt");
const users = require("../models/user.model");

const ExtractJwt = passportJWT.ExtractJwt;
const params = {
  secretOrKey: process.env.JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromHeader("x-access-token"), // First check for 'x-access-token'
    ExtractJwt.fromHeader("token"), // Then check for 'token'
  ]),
};
const mongoose = require("mongoose");
const JwtStrategy = require("passport-jwt").Strategy;

module.exports = () => {
  const strategy = new JwtStrategy(params, async (payload, done) => {
    const user = await users
      .aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(payload.id),
            isDeleted: false,
          },
        },
      ])
      .exec();
    if (user) {
      return done(null, user[0]);
    } else {
      return done(null, false); // User not found
    }
  });
  passport.use(strategy);
  return {
    initialize: () => {
      return passport.initialize();
    },
    // This is for admin panel jwt token check //
    authenticate: (req, res, next) => {
      passport.authenticate(
        "jwt",
        process.env.JWT_SECRET,
        async (err, user, info) => {
          if (err) {
            console.log(err, "err");
            return next(err);
          }

          if (!user) {
            return res.redirect("/login");
          }
          if (user) {
            req.user = user;

            return next();
          } else {
            return res.redirect("/login");
          }
        }
      )(req, res, next);
    },
    // This is for webservice jwt token check //
    authenticateAPI: (req, res, next) => {
      passport.authenticate("jwt", process.env.JWT_SECRET, (err, user) => {
        if (err) {
          return res.send({
            status: 500,
            message:
              "Please provide a valid token, your token might be expired",
          });
        }
        if (!user) {
          return res.send({
            status: 401,
            message: "Sorry, user not found!",
          });
        }

        // Check if user has the required role (e.g., "admin")
        if (user.role == "admin") {
          return res.send({
            status: 403,
            message: "You do not have permission to access this resource",
          });
        }

        req.user = user;
        return next();
      })(req, res, next);
    },
    authenticateAdminAPI: (req, res, next) => {
      passport.authenticate("jwt", process.env.JWT_SECRET, (err, user) => {
        if (err) {
          return res.send({
            status: 500,
            message:
              "Please provide a valid token, your token might be expired",
          });
        }
        if (!user) {
          return res.send({
            status: 401,
            message: "Sorry, user not found!",
          });
        }

        // Check if user has the required role (e.g., "admin")
        if (user.role !== "admin") {
          return res.send({
            status: 403,
            message: "You do not have permission to access this resource",
          });
        }

        req.user = user;
        return next();
      })(req, res, next);
    },
  };
};
