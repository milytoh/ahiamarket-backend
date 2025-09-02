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
  "/payment/get-payout-details",
  isAuth,
  walletController.getPayoutDetails
);

router.post(
  "/payment/set-payout-details",
  body("bankCode")
    .notEmpty()
    .isLength({ min: 3, max: 3 })
    .withMessage("provide a valid bank code")
    .trim(),

  body("accountNumber")
    .notEmpty()
    .withMessage("provide a valide account number")
    .trim(),
  isAuth,
  walletController.setPayoutDetails
);

router.post(
  "/payment/wallet/withdraw",
  body("amount")
    .notEmpty()
    .withMessage("Amount must be at least 1000"),
  isAuth,
  walletController.withdraw
);

module.exports = router;
