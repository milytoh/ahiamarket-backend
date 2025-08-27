const express = require("express");
const router = express.Router();

const { isAuth } = require("../middlewares/auth");
const paymentController = require("../controllers/transaction");

router.post(
  "/payment/initiate/:parentOrderId",
  isAuth,
  paymentController.directPayment
);
router.get("/paystack/callback", paymentController.verificationCallback);


//to be activate on live server
// will be called by paystack
router.post("/paystack/webhook",  paymentController.webhooks);

router.post("/payment/release/:vendorOrderId",isAuth,  paymentController.confirmDelivery);

module.exports = router;
