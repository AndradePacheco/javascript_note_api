// src/config/database.js
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
require("dotenv").config();
var MONGO_URL = process.env.MONGO_URL;
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("Succesful connection!")).catch((err) => console.log(err));
