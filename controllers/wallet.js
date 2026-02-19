require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const { ObjectId } = require("mongodb");
const mongodbConnect = require("../models/db");

const { session } = require("passport");

const Wallet = require("../models/wallet");
const User = require("../models/user");
const Tansaction = require("../models/transaction");

const { validationResult } = require("express-validator");
const { error } = require("console");

async function walletfn() {
  const { db } = await mongodbConnect();
  return new Wallet(db);
}

async function userfn() {
  const { db } = await mongodbConnect();
  return new User(db);
}

async function transactionfn() {
  const { db } = await mongodbConnect();
  return new Tansaction(db);
}

exports.fundWallet = async (req, res, next) => {
  const amount = req.body.amount;
  const userId = new ObjectId(req.user.userId);

  console.log(amount);

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
      },
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

exports.getPayoutDetails = async (req, res, next) => {
  const { accountNumber, bankCode } = req.body;

  console.log(req.body);

  try {
    // 1. Verify account
    const resolve = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );

    const accountName = resolve.data.data.account_name;

    if (!accountName) {
      const error = new Error("no accoun found");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "account found",
      accountName,
    });
  } catch (error) {
    next(error);
  }
};

exports.setPayoutDetails = async (req, res, next) => {
  const userId = req.user.userId;
  const { accountNumber, bankCode } = req.body;

  console.log(req.body);

  try {
    const userModel = await userfn();
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

    const user = await userModel.findUserById(new ObjectId(userId));

    if (!user) {
      const error = new Error("user not found");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    //  Verify account
    const resolve = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );

    const accountName = resolve.data.data.account_name;

    if (!accountName) {
      const error = new Error("no accoun found");
      error.status = 404;
      throw error;
    }

    //  Create recipient
    const recipient = await axios.post(
      "https://api.paystack.co/transferrecipient",
      {
        type: "nuban",
        name: "miracle nwafor",
        account_number: "0100000001",
        bank_code: "044", // Access Bank
        currency: "NGN",
        // type: "nuban",
        // name: accountName,
        // account_number: accountNumber,
        // bank_code: bankCode,
        // currency: "NGN",
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );

    //update user, with payment details
    await userModel.updateUser(user._id, {
      bankAccount: {
        accountNumber,
        bankCode,
        accountName,
        recipientCode: recipient.data.data.recipient_code,
      },
    });

    res 
      .status(200)
      .json({ success: true, message: "Payout details saved successfully" });
  } catch (error) {
    next(error);
  }
};

//get all nigerian bank
exports.getBanks = async (req, res, next) => {
  try {
    const banks = await axios.get(
      "https://api.paystack.co/bank?country=nigeria",
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    res.status(200).json({
      success: true,
      banks: banks.data.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.withdraw = async (req, res, next) => {
  const userId = new ObjectId(req.user.userId);
  const amount = Math.floor(Number(req.body.amount));

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

    const walletModel = await walletfn();
    const userModel = await userfn();
    const transactionModel = await transactionfn();

    const wallet = await walletModel.findWalletByOwnerId(userId);

    if (!wallet) {
      const error = new Error("wallet not found");
      error.status = 404;
      throw error;
    }

    if (amount < 1000) {
      const error = new Error("withdrawal of bellow 1000 niara is not allowed");
      error.status = 409;
      throw error;
    }

    if (wallet.balance < amount) {
      const error = new Error("Insufficient balance");
      error.status = 400;
      throw error;
    }

    // fatch users/vendor recipiant_code

    const user = await userModel.findUserById(userId);

    if (!user) {
      const error = new Error("user not found");
      error.status = 404;
      throw error;
    }

    if (!user?.bankAccount.recipientCode) {
      const error = new Error("no withdrawal acct foun");
      error.status = 404;
      throw error;
    }

    const reference = `wd-${userId.toString()}-${user._id}-${Date.now()}`;

    // Create withdrawal transaction (pending)
    const transactionData = {
      reference: reference,
      type: "withdrawal",
      userId: user._id,
      amount,
      status: "pending",
      channel: "bank_transfer",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await transactionModel.createTransaction(transactionData);

    //Deduct immediately from wallet (hold funds)
    await walletModel.updateWalletPrice(userId, -amount);

    //Initiate Paystack Transfer
    const transfer = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount: amount * 100, // convert to kobo
        recipient: user.bankAccount.recipientCode,
        reason: `Withdrawal ${transactionData.reference}`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    //update transaction with transfer response

    await transactionModel.updateTransaction(transactionData.reference, {
      status: transfer.data.data.status,
      transferId: transfer.data.data.id,
    });

    res.json({
      status: "success",
      message: "Withdrawal initiated",
      data: transfer.data,
    });

    /////TODO: move it to webhook, and

    // if (event === "transfer.failed") {
    //   const tx = await db
    //     .collection("transactions")
    //     .findOne({ reference: data.reference });
    //   await db.collection("wallets").updateOne(
    //     { ownerId: tx.vendorId, ownerType: "vendor" },
    //     { $inc: { balance: tx.amount } } // refund
    //   );
    //   await db
    //     .collection("transactions")
    //     .updateOne(
    //       { reference: data.reference },
    //       { $set: { status: "failed" } }
    //     );
    // }
  } catch (error) {
    next(error);
  }
};
