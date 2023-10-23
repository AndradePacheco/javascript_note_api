var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/app/models/note.js
var require_note = __commonJS({
  "src/app/models/note.js"(exports2, module2) {
    var mongoose = require("mongoose");
    var noteSchema = mongoose.Schema({
      title: String,
      body: String,
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    });
    noteSchema.index({ title: "text", body: "text" });
    module2.exports = mongoose.model("Note", noteSchema);
  }
});

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
var require_auth = __commonJS({
  "src/app/middlewares/auth.js"(exports2, module2) {
    require("dotenv").config();
    var secret = process.env.JWT_TOKEN;
    var jwt = require("jsonwebtoken");
    var User = require_user();
    var WithAuth2 = (req, res, next) => {
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
    module2.exports = WithAuth2;
  }
});

// src/app/routes/notes.js
var express = require("express");
var router = express.Router();
var Note = require_note();
var WithAuth = require_auth();
router.post("/", WithAuth, async (req, res) => {
  const { title, body } = req.body;
  try {
    let note = new Note({ title, body, author: req.user._id });
    await note.save();
    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ error: "Error creating note!" });
  }
});
router.get("/search", WithAuth, async (req, res) => {
  let { q } = req.query;
  try {
    let notes = await Note.find({ author: req.user._id }).find({ $text: { $search: q } });
    res.json(notes);
  } catch (error) {
  }
});
router.get("/:id", WithAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let note = await Note.findById(id);
    if (isOwner(req.user, note))
      res.json(note);
    else
      res.status(403).json({ error: "Error: Permission denied!" });
  } catch (error) {
    res.status(500).json({ error: "Error to get the note!" });
  }
});
router.get("/", WithAuth, async (req, res) => {
  try {
    let notes = await Note.find({ author: req.user._id });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error });
  }
});
router.put("/:id", WithAuth, async (req, res) => {
  const { title, body } = req.body;
  const { id } = req.params;
  try {
    let note = await Note.findById(id);
    if (isOwner(req.user, note)) {
      let note2 = await Note.findByIdAndUpdate(
        id,
        { $set: { title, body } },
        { $upsert: true, "new": true }
      );
      res.json(note2);
    } else
      res.status(403).json({ error: "Error: Permission denied!" });
  } catch (error) {
    res.status(500).json({ error: "Error to update the note!" });
  }
});
router.delete("/:id", WithAuth, async (req, res) => {
  const { id } = req.params;
  try {
    let note = await Note.findById(id);
    if (isOwner(req.user, note)) {
      await note.deleteOne();
      res.json({ message: "Success!" });
    } else
      res.status(403).json({ error: "Error: Permission denied!" });
  } catch (error) {
    res.status(500).json({ error: "Error delete the note!" });
  }
});
var isOwner = (user, note) => {
  if (JSON.stringify(user._id) === JSON.stringify(note.author._id))
    return true;
  else
    return false;
};
module.exports = router;
