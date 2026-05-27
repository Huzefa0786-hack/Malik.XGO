import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

/* ROUTES */
import authRoutes from "./routes/auth.js";
import depositRoutes from "./routes/deposit.js";
import withdrawRoutes from "./routes/withdraw.js";
import walletRoutes from "./routes/wallet.js";
import controlRoutes from "./routes/control.js";
import betRoutes from "./routes/bet.js";
import transactionRoutes from "./routes/transaction.js";

dotenv.config();

const app = express();

/* MIDDLEWARE */
app.use(cors());

app.use(express.json());

/* API ROUTES */
app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/deposit",
  depositRoutes
);

app.use(
  "/api/withdraw",
  withdrawRoutes
);

app.use(
  "/api/wallet",
  walletRoutes
);

app.use(
  "/api/control",
  controlRoutes
);

app.use(
  "/api/bet",
  betRoutes
);

app.use(
  "/api/transaction",
  transactionRoutes
);

/* ROOT */
app.get(
  "/",
  (
    req,
    res
  ) => {

    res.send(
      "API RUNNING"
    );

  }
);

/* DATABASE */
mongoose
  .connect(
    process.env.MONGO_URI
  )
  .then(() => {

    console.log(
      "MongoDB Connected"
    );

  })
  .catch(
    (err) => {

      console.log(
        err
      );

    }
  );

/* SERVER */
const PORT =
  process.env.PORT ||
  5000;

app.listen(
  PORT,
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);