import express from "express";

import Withdraw from "../models/Withdraw.js";
import User from "../models/User.js";

const router =
  express.Router();

/* CREATE WITHDRAW */
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

      if (
        foundUser.wallet <
        amount
      ) {

        return res
          .status(400)
          .json({
            error:
              "Insufficient balance",
          });

      }

      const newWithdraw =
        new Withdraw({
          uid,
          amount,
          status:
            "pending",
        });

      await newWithdraw.save();

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

/* GET WITHDRAWS */
router.get(
  "/",
  async (
    req,
    res
  ) => {

    try {

      const withdraws =
        await Withdraw.find()
          .sort({
            createdAt: -1,
          });

      res.json(
        withdraws
      );

    } catch (error) {

      console.log(
        error
      );

    }

  }
);

/* APPROVE WITHDRAW */
router.put(
  "/approve/:id",
  async (
    req,
    res
  ) => {

    try {

      const withdraw =
        await Withdraw.findById(
          req.params.id
        );

      if (!withdraw) {

        return res
          .status(404)
          .json({
            error:
              "Withdraw not found",
          });

      }

      const foundUser =
        await User.findOne({
          uid:
            withdraw.uid,
        });

      if (!foundUser) {

        return res
          .status(404)
          .json({
            error:
              "User not found",
          });

      }

      if (
        foundUser.wallet <
        withdraw.amount
      ) {

        return res
          .status(400)
          .json({
            error:
              "Insufficient wallet",
          });

      }

      foundUser.wallet -=
        Number(
          withdraw.amount
        );

      await foundUser.save();

      withdraw.status =
        "approved";

      await withdraw.save();

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