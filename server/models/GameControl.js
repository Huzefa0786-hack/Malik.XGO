import mongoose from "mongoose";

const GameControlSchema =
  new mongoose.Schema({
    numcards: {
      type: String,
      default: "random",
    },

    spin: {
      type: String,
      default: "random",
    },

    sky: {
      type: String,
      default: "random",
    },

    rtp: {
      type: Number,
      default: 72,
    },

    gameStatus: {
      type: String,
      default: "RUNNING",
    },
  });

const GameControl =
  mongoose.model(
    "GameControl",
    GameControlSchema
  );

export default GameControl;