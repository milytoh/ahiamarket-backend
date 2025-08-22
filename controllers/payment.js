const { ObjectId, MongoClient } = require("mongodb");

require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

const { Orders, ParentOrders } = require("../models/order");
const User = require("../models/user");
const Payment = require("../models/payment");

const mongodbConnect = require("../models/db");

async function parentOrderfn() {
  const { db } = await mongodbConnect();
  return new ParentOrders(db);
}

async function userfn() {
  const { db } = await mongodbConnect();
  return new User(db);
}

async function paymentfn() {
  const { db } = await mongodbConnect();
  return new Payment(db);
}

async function oderfn() {
  const { db } = await mongodbConnect();
  return new Orders(db);
}

exports.directPayment = async (req, res, next) => {
  const parent_orderId = new ObjectId(req.params.parentOrderId);

  const parentOrderModel = await parentOrderfn();
  const userModel = await userfn();

  const parenOrder = await parentOrderModel.findParentOrderById(parent_orderId);
  try {
    // //checking if amout is a number
    // if (!Number.isInteger(amount) || amount <= 0) {
    //   const error = new Error("provide valide number");
    //   error.status = 400;
    //   throw error;
    // }
    if (!parenOrder) {
      const error = new Error("no product found");
      error.status = 404;
      throw error;
    }

    const user = await userModel.findUserById(new ObjectId(req.user.userId));

    if (!user) {
      const error = new Error("user not found");
      error.status = 404;
      throw error;
    }

    const reference = `ord-${parenOrder._id.toString()}-${
      user._id
    }-${Date.now()}`;

    const resp = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: parenOrder.total * 100, // kobo
        callback_url: process.env.CALLBACK_URL,
        reference,
        metadata: {
          parent_order_id: parenOrder._id,
          buyer_id: user._id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Payment initialized, redirect customer to authorization_url",
      data: resp.data,
    });
  } catch (error) {
    next(error);
  }
};

// verification callback
exports.paymentCallback = async (req, res, next) => {
  const reference = req.query.reference;

  try {
    //  Verify payment with Paystack
    const verifyResp = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = verifyResp.data.data; // Paystack returns transaction details

    if (data.status !== "success") {
      const error = new Error("payment faild");
      error.status = 400;
      throw error;
    }

    const parentOrderModel = await parentOrderfn();
    const paymentModel = await paymentfn();
    const orderModel = await oderfn();
    ////TODO: move to escrow route
    const parenOrderId = new ObjectId(data.metadata.parent_order_id);
    const pupdate = await parentOrderModel.updateParentOrderById(
      parenOrderId,
      "paid_escrow_hold",
      data.reference,
      "awaiting_fulfillment"
    );

    ///update order with same parentorderid
    await orderModel.updateManyByParantOrderId(
      parenOrderId,
      "paid_escrow_hold",
      data.reference,
      "awaiting_fulfillment"
    );

    //  Create payment record
    const paymenData = await paymentModel.createPayment({
      reference: data.reference,
      orderId: new ObjectId(data.metadata.parent_order_id),
      buyerId: new ObjectId(data.metadata.buyer_id),
      amount: data.amount / 100, // convert back from kobo
      status: data.status,
      channel: data.channel,
      paidAt: data.paid_at,
      currency: data.currency,
      customerEmail: data.customer.email,
    });

    
    res.status(200).json({
      seccess: true,
      message: "payment seccessful",
    });
  } catch (error) {
    next(error);
  }
};

exports.webhooks = async (req, res, next) => {
  // 1. Verify signature
  const signature = req.get("x-paystack-signature");
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  try {
    if (hash !== signature) {
      const error = new Error("Invalid signature");
      error.status = 400;
      throw error;
    }

    //  Process event
    const event = req.body;

    if (event.event !== "charge.success") {
      const error = new Error("payment was not successfull");
      error.status = 402;
      throw error;
    }

    // TODO: update order & create payment record here
    // 3. Reply 200 quickly (very important)

    res.status(200).json({
      success: true,
      message: "payment seccesfull",
    });
  } catch (error) {
    next(error);
  }
};
