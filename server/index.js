import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import walletRoutes from "./routes/wallet.js";
import depositRoutes from "./routes/deposit.js";
import withdrawRoutes from "./routes/withdraw.js";
import betRoutes from "./routes/bet.js";

dotenv.config();
require(
 "./jobs/colorEngine.js"
);
const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/api/deposit", depositRoutes);

app.use("/api/withdraw", withdrawRoutes);

app.use("/api/bet", betRoutes);

app.get("/", (req, res) => {

  res.send("MALIK SERVER RUNNING");

});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {

    console.log(
      "MongoDB Connected"
    );

    app.listen(5000, () => {

      console.log(
        "Server running on port 5000"
      );

    });

  })
  .catch((err) => {

    console.log(err);

  });