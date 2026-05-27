const express = require(
  "express"
);

const router =
  express.Router();

const Transaction = require(
  "../models/Transaction"
);

// Get User Transactions
router.get(
  "/:username",
  async (req, res) => {
    try {
      const data =
        await Transaction.find({
          username:
            req.params.username,
        }).sort({
          createdAt: -1,
        });

      res.json(data);
    } catch (error) {
      console.log(error);

      res.status(500).json({
        msg: "Server Error",
      });
    }
  }
);

module.exports = router;