const mongoose = require(
  "mongoose"
);

const transactionSchema =
  new mongoose.Schema(
    {
      username: String,

      type: String,

      amount: Number,

      status: String,
    },
    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Transaction",
    transactionSchema
  );