const express = require("express");
const router = express.Router();

const { isAuth } = require("../middlewares/auth");
const paymentController = require("../controllers/payment");

router.post(
  "/payment/initiate/:parentOrderId",
  isAuth,
  paymentController.directPayment
);
router.get("/paystack/callback", paymentController.paymentCallback);
router.post("/payment/verify/:reference", paymentController.paymentVerify);

module.exports = router;
