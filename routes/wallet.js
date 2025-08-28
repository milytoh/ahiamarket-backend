const express = require("express");
const router = express.Router();

const walletController = require("../controllers/wallet");
const { isAuth } = require("../middlewares/auth");

const { body } = require("express-validator");

router.post(
  "/wallet/fund",
  body("amount")
    .notEmpty()
    .isInt({ min: 100 })
    .withMessage("Amount must be at least 100"),
  isAuth,
  walletController.fundWallet
);

router.post(
  "wallet/withdraw",
  body("amount")
    .notEmpty()
    .isInt({ min: 1000 })
    .withMessage("Amount must be at least 1000"),
  isAuth,
  walletController.withdraw
);

router.post(
  "/payment/get-payout-details",
  isAuth,
  walletController.getPayoutDetails
);

router.post(
  "/payment/set-payout-details",
  body("bankCode")
    .notEmpty()
    .isInt({ min: 3, max: 3 })
    .trim()

    .withMessage("provide a valide accoun number"),
  body("accountNumber").notEmpty().isInt().trim(),
  isAuth,
  walletController.setPayoutDetails
);

module.exports = router;
