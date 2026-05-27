import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

const router = express.Router();

// REGISTER
router.post(
  "/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body;

      const existing =
        await User.findOne({
          email,
        });

      if (existing) {
        return res
          .status(400)
          .json({
            error:
              "Email already exists",
          });
      }

      const hashed =
        await bcrypt.hash(
          password,
          10
        );
const uid =
  "MK" +
  Math.floor(
    100000 +
      Math.random() *
        900000
  );

const user =
  new User({
    name,
    email,
    password:
      hashedPassword,
    uid,
    wallet: 0,
  });

      res.json({
        success: true,
        user,
      });
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error:
          "Register failed",
      });
    }
  }
);

// LOGIN
router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      const user =
        await User.findOne({
          email,
        });

      if (!user) {
        return res
          .status(400)
          .json({
            error:
              "User not found",
          });
      }

      const match =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!match) {
        return res
          .status(400)
          .json({
            error:
              "Wrong password",
          });
      }

      const token = jwt.sign(
        {
          id: user._id,
        },
        process.env.JWT_SECRET
      );

      res.json({
        success: true,
        token,
        user,
      });
    } catch (err) {
      console.log(err);

      res.status(500).json({
        error:
          "Login failed",
      });
    }
  }
);

export default router;
// Ban User
router.put(
  "/ban/:id",
  async (req, res) => {

    try {

      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {
        return res
          .status(404)
          .json({
            msg: "User not found",
          });
      }

      user.banned =
        !user.banned;

      await user.save();

      res.json({
        msg: "User updated",
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        msg: "Server Error",
      });

    }
  }
);

// Delete User
router.delete(
  "/delete/:id",
  async (req, res) => {

    try {

      await User.findByIdAndDelete(
        req.params.id
      );

      res.json({
        msg: "User deleted",
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        msg: "Server Error",
      });

    }
  }
);