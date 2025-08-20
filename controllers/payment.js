const { ObjectId, MongoClient } = require("mongodb");

require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

const { Orders, ParentOrders } = require("../models/order");
const User = require("../models/user");
const Payment = require("../models/payment");

const mongodbConnect = require("../models/db");
const { error } = require("console");

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

exports.directPayment = async (req, res, next) => {
  const parent_orderId = new ObjectId(req.params.parentOrderId);
  const amount = req.body.price;

  const orderModel = await parentOrderfn();
  const userModel = await userfn();

  const parenOrder = await orderModel.findParentOrderById(parent_orderId);
  try {
    //checking if amout is a number
    if (!Number.isInteger(amount) || amount <= 0) {
      const error = new Error("provide valide number");
      error.status = 400;
      throw error;
    }
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

    const reference = `ord_${parenOrder._id.toString()}_${Math.random()}_${Date.now()}`;

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

    
    const pupdate = await parentOrderModel.updateParentOrder(
      data.metadata.parent_order_id,
      "paid"
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

    
  } catch (error) {
    next(error);
  }
};

exports.paymentVerify = async (req, res, next) => {
  const reference = req.params.reference;
  console.log("lllllllll");
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

    const pupdate = await parentOrderModel.updateParentOrderById(
      new ObjectId(data.metadata.parent_order_id),
      "paid",
      reference
    );

    console.log(pupdate, "uuuuuu");

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

    console.log(paymenData, "pppp");
  } catch (error) {
    next(error);
  }
};
