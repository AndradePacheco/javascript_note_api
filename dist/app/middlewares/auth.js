var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/app/models/user.js
var require_user = __commonJS({
  "src/app/models/user.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var bcrypt = require("bcrypt");
    var userSchema = mongoose.Schema({
      name: String,
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now }
    });
    userSchema.pre("save", function(next) {
      if (this.new || this.isModified("password")) {
        bcrypt.hash(this.password, 10, (err, hashedPassword) => {
          if (err)
            next(err);
          else {
            this.password = hashedPassword;
            next();
          }
        });
      }
    });
    userSchema.methods.isCorrectPassword = async function(password, callback) {
      bcrypt.compare(password, this.password, function(err, same) {
        if (err)
          callback(err);
        else
          callback(err, same);
      });
    };
    module2.exports = mongoose.model("User", userSchema);
  }
});

// src/app/middlewares/auth.js
require("dotenv").config();
var secret = process.env.JWT_TOKEN;
var jwt = require("jsonwebtoken");
var User = require_user();
var WithAuth = (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token)
    res.status(401).json({ error: "Unauthorized: no token provided!" });
  else {
    jwt.verify(token, secret, (err, decode) => {
      if (err)
        res.status(401).json({ error: "Unauthorized: invalid token!" });
      else {
        req.email = decode.email;
        User.findOne({ email: decode.email }).then((user) => {
          req.user = user;
          next();
        }).catch((err2) => res.status(401).json({ error: err2 }));
      }
    });
  }
};
module.exports = WithAuth;
