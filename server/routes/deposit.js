import express from "express";

import Deposit from "../models/Deposit.js";
import User from "../models/User.js";

const router =
  express.Router();

/* CREATE DEPOSIT */
router.post(
  "/",
  async (
    req,
    res
  ) => {

    try {

      const {
        uid,
        amount,
      } = req.body;

      const foundUser =
        await User.findOne({
          uid,
        });

      if (!foundUser) {

        return res
          .status(404)
          .json({
            error:
              "User not found",
          });

      }

      const newDeposit =
        new Deposit({
          uid,
          amount,
          status:
            "pending",
        });

      await newDeposit.save();

      res.json({
        success: true,
      });

    } catch (error) {

      console.log(
        error
      );

      res
        .status(500)
        .json({
          error:
            "Server Error",
        });

    }

  }
);

/* GET DEPOSITS */
router.get(
  "/",
  async (
    req,
    res
  ) => {

    try {

      const deposits =
        await Deposit.find()
          .sort({
            createdAt: -1,
          });

      res.json(
        deposits
      );

    } catch (error) {

      console.log(
        error
      );

    }

  }
);

/* APPROVE DEPOSIT */
router.put(
  "/approve/:id",
  async (
    req,
    res
  ) => {

    try {

      const deposit =
        await Deposit.findById(
          req.params.id
        );

      if (!deposit) {

        return res
          .status(404)
          .json({
            error:
              "Deposit not found",
          });

      }

      const foundUser =
        await User.findOne({
          uid:
            deposit.uid,
        });

      if (!foundUser) {

        return res
          .status(404)
          .json({
            error:
              "User not found",
          });

      }

      foundUser.wallet +=
        Number(
          deposit.amount
        );

      await foundUser.save();

      deposit.status =
        "approved";

      await deposit.save();

      res.json({
        success: true,
      });

    } catch (error) {

      console.log(
        error
      );

      res
        .status(500)
        .json({
          error:
            "Server Error",
        });

    }

  }
);

export default router;