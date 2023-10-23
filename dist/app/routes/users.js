var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/app/models/user.js
var require_user = __commonJS({
  "src/app/models/user.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var bcrypt2 = require("bcrypt");
    var userSchema = mongoose.Schema({
      name: String,
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now }
    });
    userSchema.pre("save", function(next) {
      if (this.new || this.isModified("password")) {
        bcrypt2.hash(this.password, 10, (err, hashedPassword) => {
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
      bcrypt2.compare(password, this.password, function(err, same) {
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
var require_auth = __commonJS({
  "src/app/middlewares/auth.js"(exports2, module2) {
    require("dotenv").config();
    var secret2 = process.env.JWT_TOKEN;
    var jwt2 = require("jsonwebtoken");
    var User2 = require_user();
    var WithAuth2 = (req, res, next) => {
      const token = req.headers["x-access-token"];
      if (!token)
        res.status(401).json({ error: "Unauthorized: no token provided!" });
      else {
        jwt2.verify(token, secret2, (err, decode) => {
          if (err)
            res.status(401).json({ error: "Unauthorized: invalid token!" });
          else {
            req.email = decode.email;
            User2.findOne({ email: decode.email }).then((user) => {
              req.user = user;
              next();
            }).catch((err2) => res.status(401).json({ error: err2 }));
          }
        });
      }
    };
    module2.exports = WithAuth2;
  }
});

// src/app/routes/users.js
var express = require("express");
var router = express.Router();
var User = require_user();
var jwt = require("jsonwebtoken");
var WithAuth = require_auth();
require("dotenv").config();
var bcrypt = require("bcrypt");
var secret = process.env.JWT_TOKEN;
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const user = new User({ name, email, password });
  try {
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Error registering user" });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user)
      res.status(401).json({ error: "Incorret email!" });
    else {
      user.isCorrectPassword(password, function(err, same) {
        if (!same)
          res.status(401).json({ error: "Incorret password!" });
        else {
          const token = jwt.sign({ email }, secret, { expiresIn: "10d" });
          res.json({ user, token });
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal error, please try again" });
  }
});
router.put("/", WithAuth, async function(req, res) {
  const { name, email } = req.body;
  try {
    var user = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: { name, email } },
      { $upsert: true, "new": true }
    );
    res.json(user);
  } catch (error) {
    res.status(401).json({ error });
  }
});
router.put("/password", WithAuth, async function(req, res) {
  const { password } = req.body;
  try {
    var user = await User.findOne({ _id: req.user._id });
    user.password = password;
    user.save;
    res.json(user);
  } catch (error) {
    res.status(401).json({ error });
  }
});
router.delete("/", WithAuth, async (req, res) => {
  try {
    let user = User.findById(req.user._id);
    await user.deleteOne();
    res.json({ message: "Success" }).status(201);
  } catch (error) {
    res.status(500).json({ error: "Error deleting user" });
  }
});
module.exports = router;
