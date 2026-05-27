import express from "express";

import User from "../models/User.js";

import GameControl from "../models/GameControl.js";

const router =
  express.Router();

// PLACE BET
router.post(
  "/place",
  async (
    req,
    res
  ) => {

    try {

      const {
        userId,
        selection,
        amount,
      } = req.body;

      const user =
        await User.findById(
          userId
        );

      if (!user) {

        return res
          .status(404)
          .json({
            error:
              "User not found",
          });

      }

      if (
        user.wallet <
        Number(amount)
      ) {

        return res
          .status(400)
          .json({
            error:
              "Insufficient balance",
          });

      }

      // REMOVE BET
      user.wallet -=
        Number(amount);

      // CONTROL
      const control =
        await GameControl.findOne();

      let result;

      if (
        control &&
        control.numcards !==
          "random"
      ) {

        result =
          Number(
            control.numcards
          );

      } else {

        result =
          Math.floor(
            Math.random() *
              10
          ) + 1;

      }

      let win =
        false;

      let winAmount =
        0;

      // WIN
      if (
        Number(
          selection
        ) === result
      ) {

        win = true;

        winAmount =
          Number(amount) *
          9;

        user.wallet +=
          winAmount;

      }

      await user.save();

      return res.json({
        success: true,
        result,
        win,
        winAmount,
        wallet:
          user.wallet,
      });

    } catch (error) {

      console.log(
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Server Error",
        });

    }

  }
);

export default router;