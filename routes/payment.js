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


//to be activate on live server
// will be called by paystack
router.post("/paystack/webhook", paymentController.webhooks)

module.exports = router;
