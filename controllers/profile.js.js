const { ObjectId } = require("mongodb");
const mongodbConnect = require("../models/db");

const User = require("../models/user");
const Transaction = require("../models/transaction")

async function userfn() {
  const { db } = await mongodbConnect();
  return new User(db);
}

async function transactionfn() {
  const { db } = await mongodbConnect();
  return new Transaction(db);
}

exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = new ObjectId(req.user.userId);
    const userModel = await userfn();

    const user = await userModel.findUserById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    const profile = await userModel.profile(userId);

    if (!profile) {
      const error = new Error("Profile not found");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "User profile",
      profile,
    });
  } catch (error) {
    next(error);
  }
};

exports.wallet = async (req, res, next) => {
  try {
    const userId = new ObjectId(req.user.userId);
    const userModel = await userfn();

    const user = await userModel.findUserById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    const profileWallet = await userModel.profileWallet(userId);

    if (!profileWallet) {
      const error = new Error("Profile wallet not found");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "profile wallet",
      profileWallet,
    });
  } catch (err) {}
};

exports.transactions = async(req, res, next) => {
 
  const { startDate, endDate, type, page = 1, limit = 20 } = req.query;
  
  try {
    const userId = new ObjectId(req.user.userId);
    const userModel = await userfn();
    const transactionModel = await transactionfn();

    const user = await userModel.findUserById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    const query = {
      userId: req.user.id,
    };

    // Filter by transaction type
    if (type && type !== "all") {
      query.type = type;
    }

    await transactionModel;
  } catch (error) {
    
  }

}
