import express from "express";

const router = express.Router();

router.put("/update", async (req, res) => {
  try {
    const { amount, type } = req.body;

    // Temporary testing wallet
    let wallet = 1000;

    if (type === "remove") {
      wallet -= amount;
    }

    if (type === "add") {
      wallet += amount;
    }

    return res.json({
      success: true,
      wallet,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Wallet update failed",
    });
  }
});

export default router;