const bcrypt = require("bcrypt");

require("dotenv").config();

const mongodb = require("mongodb");

const User = require("../models/user");

const mongodbConnect = require("../models/db");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const sendOtpEmail = require("../utils/sendOtp");
const generateOtp = require("../utils/otpGenerator");
const sendPwdResetEmail = require("../utils/sendPwdReset");
const Wallet = require("../models/wallet");

async function walletfn() {
  const { db } = await mongodbConnect();
  return new Wallet(db);
}

exports.signup = async (req, res, next) => {
  const { fullName, email, password, terms } = req.body;

  const result = validationResult(req);

  if (!result.isEmpty()) {
    const error = new Error("Invalid inputs");
    error.statusCode = 400;
    error.errors = result.array();
    next(error);
    return;
  }

  try {
    const { db } = await mongodbConnect();
    const userModel = new User(db);

    const userEmail = await userModel.findUserByEmail(email);

    // checking if users email already exist
    if (userEmail) {
      const error = new Error("user with the email already exist!");
      error.status = 409;
      error.isOperational = true;
      error.errors = [
        { field: "email", message: "This email is already registered" },
      ];
      throw error;
    }

    const hashed_pwd = await bcrypt.hash(password, 12);

    //generating Otp
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // grouping user data object
    const userData = {
      fullname: fullName,
      email: email,
      // phone: phone,
      password: hashed_pwd,
      termsCondition: true,
      otp: otp,
      otpExpiresAt: otpExpiresAt,
      email_is_verified: false,
      provider: "local",
      googleId: null,
      role: "buyer",
      is_vendor_approved: false,
      vendor_profile: null,
      wallet: null,
      status: {
        state: "active",
        reason: null,
        suspended_until: null,
        updated_at: new Date(),
      },
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const result = await userModel.signup(userData);
    if (!result) {
      const error = new Error("creating account failed!");
      error.status = 409;
      error.isOperational = true;
      throw error;
    }

    // creating users wallet
    const walletData = {
      ownerId: result.insertedId,
      ownerType: "user",
      balance: 0,
      currency: "NGN",
    };
    const walletModel = await walletfn();
    await walletModel.createWallet(walletData);

    await userModel.findUserById(result.insertedId);

    await sendOtpEmail(email, otp);

    res.status(201).json({
      success: true,
      message: "account created succesfuly",
      // userData: user,
    });
  } catch (err) {
    return next(err);
  }
};

exports.otpRequest = async (req, res, next) => {
  const email = req.body.email;

  try {
    const { db } = await mongodbConnect();
    const userModel = new User(db);

    const user = await userModel.findUserByEmail(email);
    // checking if user with the email exist
    if (!user) {
      const error = new Error("user with this email does not exist");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    if (user.email_is_verified) {
      const error = new Error("user with this email already verified");
      error.status = 409;
      error.isOperational = true;
      throw error;
    }

    //generating Otp
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const updateData = {
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    };

    await userModel.updateUserByEmail(user.email, updateData);

    await sendOtpEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "opt sent to our email, please verifyy your email address",
    });
  } catch (error) {
    next(error);
  }
};

//email verification
exports.emailVerify = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const { db } = await mongodbConnect();
    const userModel = new User(db);

    const user = await userModel.findUserByEmail(email);

    if (!user) {
      const error = new Error('User not found"');
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
      const error = new Error("Invalid or expired OTP");
      error.isOperational = true;
      error.status = 400;
      throw error;
    }
    const updateData = {
      otp: null,
      email_is_verified: true,
      otpExpiresAt: null,
      updated_at: Date.now(),
    };
    await userModel.updateUser(user._id, updateData);

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now login.",
    });
  } catch (err) {
    next(err);
  }
};

//post login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(req.body);
  try {
    const { db } = await mongodbConnect();
    const userModel = new User(db);

    const user = await userModel.findUserByEmail(email);
    // checking if user with the provided email exist
    if (!user) {
      const error = new Error("no user found");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    // check if users account is still active
    if (user.status.state !== "active") {
      const error = new Error(
        `your account has been ${user.status.state}, ${
          user.status.suspended_until
            ? `accont will be active again on${user.status.suspended_until}`
            : "You can't access the account again"
        } `,
      );

      error.status = 403;
      error.isOperational = true;
      throw error;
    }

    // checkin if password matches
    const pwdIsMatch = await bcrypt.compare(password, user.password);
    if (!pwdIsMatch) {
      const error = new Error("incorrect password");
      error.status = 401;
      error.isOperational = true;
      throw error;
    }

    //checking if email is verified befor allowing you to login
    if (!user.email_is_verified) {
      const err = new Error("please verify your email to continue");
      err.status = 403;
      err.isOperational = true;
      throw err;
    }

    const jwt_secret = process.env.JWT_SECRET;
    // generating a jwtoken
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      jwt_secret,
      {
        expiresIn: "6h",
      },
    );

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token: token,
    });
  } catch (err) {
    next(err);
  }
};

// sending a rest password link to your email
exports.requestPasswordReset = async (req, res, next) => {
  const email = req.body.email;

  try {
    const { db } = await mongodbConnect();
    const userModel = new User(db);

    const user = await userModel.findUserByEmail(email);
    if (!user) {
      const error = new Error("user not found");
      error.status = 404;
      throw error;
    }
    const jwt_secret = process.env.JWT_SECRET;
    // generating a jwtoken
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      jwt_secret,
      {
        expiresIn: "1h",
      },
    );

    await sendPwdResetEmail(email, user._id, token);

    res.status(200).json({
      success: true,
      message: "check your email a password reset link has been sent to you!",
    });
  } catch (err) {
    next(err);
  }
};

//pasword reset
exports.passwordReset = async (req, res, next) => {
  const { password } = req.body;
  const { id, token } = req.query;

  console.log(req.query);

  console.log(id, token, password);

  try {
    const { db } = await mongodbConnect();
    const userModel = new User(db);

    const userId = new mongodb.ObjectId(id);

    const user = await userModel.findUserById(userId);

    /// checking if user exist
    if (!user) {
      const error = new Error("user not found");
      error.status = 404;
      throw error;
    }

    const encod = jwt.verify(token.trim(), process.env.JWT_SECRET);

    const encryptedPassword = await bcrypt.hash(password, 12);

    await userModel.updateUser(user._id, { password: encryptedPassword });

    res.status(201).json({
      success: true,
      message: "password successfully updated, login with your new passwork",
    });
  } catch (err) {
    next(err);
  }
};

//authentication with google
exports.googleAuth = async (req, res, next) => {
  const { db } = await mongodbConnect();
  const userModel = new User(db);

  try {
    const token = req.user.token;
    const user = req.user;

    const userData = {
      fullname: user.name,
      email: user.email,
      // phone: phone,
      password: null,
      email_is_verified: true,
      provider: "google",
      googleId: user.googleId,
      role: ["buyer"],
      is_vendor_approved: false,
      vendor_profile: null,
      wallet: null,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const users = await userModel.findAllUsers();
    console.log(users);

    const userEmail = await userModel.findUserByEmail(user.email);

    if (!userEmail) {
      const result = await userModel.signup(userData);
      if (!result) {
        const error = new Error("creating account failed!");
        error.status = 409;
        error.isOperational = true;
        throw error;
      }
    }

    return res.redirect(`http://localhost:5173/auth/callback?token=${token}`);
  } catch (err) {
    console.log(err);
    const error = new Error(" Google authentication failed");
    error.status(401);

    next(error);
  }
};

exports.logout = (req, res, next) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (err) {
    next(err);
  }
};

// "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath "C:\data\db" --replSet rs0
