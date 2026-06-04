const mongoose = require("mongoose");

const ColorRoundSchema =
  new mongoose.Schema({

    period: String,

    resultNumber: Number,

    resultColor: String,

    createdAt: {
      type: Date,
      default: Date.now,
    },

  });

module.exports =
  mongoose.model(
    "ColorRound",
    ColorRoundSchema
  );