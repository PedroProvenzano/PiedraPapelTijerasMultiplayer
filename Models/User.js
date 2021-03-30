const mongoose = require("mongoose");

const User = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  ganadas: {
    type: Number,
    required: true,
  },
  perdidas: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("User", User);
