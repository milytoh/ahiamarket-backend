require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const { ObjectId } = require("mongodb");
const mongodbConnect = require("../models/db");

const { session } = require("passport");

const Wallet = require("../models/wallet");
const User = require("../models/user");

const { validationResult } = require("express-validator");

async function walletfn() {
  const { db } = await mongodbConnect();
  return new Wallet(db);
}

async function userfn() {
  const { db } = await mongodbConnect();
  return new User(db);
}

exports.fundWallet = async (req, res, next) => {
  const amount = req.body.amount;
  const userId = new ObjectId(req.user.userId);

  const userModel = await userfn();

  try {
    //checking if any field is invalid
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid inputs",
        error: result.array().map((err) => ({
          field: err.path,
          errMessage: err.msg,
        })),
      });
    }

    const user = await userModel.findUserById(userId);

    const reference = `depo-${user._id}-${Date.now()}`;

    const resp = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: amount * 100, // kobo
        callback_url: process.env.CALLBACK_URL,
        reference,
        metadata: {
          type: "deposite",
          userId: user._id,
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
      message: "wallet deposite initialized,",
      data: resp.data,
    });
  } catch (error) {
    next(error);
  } finally {
  }
};
