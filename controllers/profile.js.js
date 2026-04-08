const { ObjectId } = require("mongodb");
const mongodbConnect = require("../models/db");

const User = require("../models/user");
const Transaction = require("../models/transaction");

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

exports.transactions = async (req, res, next) => {
  const { startDate, endDate, type } = req.query;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;

  try {
    const userId = new ObjectId(req.user.userId);
    const userModel = await userfn();
    const transactionModel = await transactionfn();

    /// limiting date to 6 month filter
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (startDate && endDate) {
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());

      if (months > 6) {
        const error = new Error("Date range cannot exceed 6 months");
        error.status = 400;
        error.isOperational = true;
        throw error;
      }
    }

    const user = await userModel.findUserById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    const query = {
      userId: userId,
    };

    // Filter by transaction type
    if (type && type !== "all") {
      query.type = type;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const [transactions, total] = await transactionModel.userTransactions(
      query,
      page,
      limit,
    );

   

    res.status(200).json({
      success: true,
      message: "user transactions",
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

