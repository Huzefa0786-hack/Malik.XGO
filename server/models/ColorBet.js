const mongoose = require("mongoose");

const ColorBetSchema =
  new mongoose.Schema({

    userId: String,

    username: String,

    period: String,

    type: String,

    value: String,

    amount: Number,

    status: {
      type: String,
      default: "pending",
    },

  });

module.exports =
  mongoose.model(
    "ColorBet",
    ColorBetSchema
  );