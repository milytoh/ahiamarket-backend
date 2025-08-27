const express = require("express");
const router = express.Router();

const walletController = require("../controllers/wallet");
const { isAuth } = require("../middlewares/auth");

const { body } = require("express-validator");

router.post(
  "/fund-wallet",
  body("amount")
    .notEmpty()
    .isInt({ min: 100 })
    .withMessage("Amount must be at least 100"),
  isAuth,
  walletController.fundWallet
);

module.exports = router;
