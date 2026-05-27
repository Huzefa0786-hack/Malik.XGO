const express =
  require("express");

const router =
  express.Router();

const GameControl =
  require(
    "../models/GameControl"
  );

// GET CONTROL
router.get(
  "/",
  async (
    req,
    res
  ) => {

    let control =
      await GameControl.findOne();

    if (!control) {

      control =
        await GameControl.create(
          {}
        );

    }

    res.json(control);

  }
);

// UPDATE CONTROL
router.put(
  "/",
  async (
    req,
    res
  ) => {

    let control =
      await GameControl.findOne();

    if (!control) {

      control =
        await GameControl.create(
          {}
        );

    }

    control.numcards =
      req.body.numcards;

    control.spin =
      req.body.spin;

    control.sky =
      req.body.sky;

    control.rtp =
      req.body.rtp;

    control.gameStatus =
      req.body.gameStatus;

    await control.save();

    res.json(control);

  }
);

module.exports =
  router;