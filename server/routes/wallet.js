import express from "express";

import User from "../models/User.js";

const router =
  express.Router();

// SEARCH USER
router.get(
  "/:uid",
  async (
    req,
    res
  ) => {

    try {

      const user =
        await User.findOne({
          uid:
            req.params.uid,
        });

      if (!user) {

        return res
          .status(404)
          .json({
            error:
              "User not found",
          });

      }

      res.json(user);

    } catch (error) {

      res
        .status(500)
        .json({
          error:
            "Server Error",
        });

    }

  }
);

// UPDATE WALLET
router.put(
  "/update",
  async (
    req,
    res
  ) => {

    try {

      const {
        uid,
        amount,
        type,
      } = req.body;

      const user =
        await User.findOne({
          uid,
        });

      if (!user) {

        return res
          .status(404)
          .json({
            error:
              "User not found",
          });

      }

      if (
        type === "add"
      ) {

        user.wallet +=
          Number(amount);

      } else {

        user.wallet -=
          Number(amount);

      }

      await user.save();

      res.json({
        success: true,
        wallet:
          user.wallet,
      });

    } catch (error) {

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