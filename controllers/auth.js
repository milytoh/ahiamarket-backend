const bcrypt = require("bcrypt");

require("dotenv").config();

const mongodb = require('mongodb');

const User = require("../models/user");
const mongodbConnect = require("../models/db");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const sendOtpEmail = require("../utils/sendOtp");
const generateOtp = require("../utils/otpGenerator");
const sendPwdResetEmail = require("../utils/sendPwdReset");

exports.signup = async (req, res, next) => {
  const { fullname, email, password } = req.body;

  const result = validationResult(req);

  //checking if any field is invalid
  if (!result.isEmpty()) {
    return res.status(400).json({
      message: "Invalid inputs",
      error: result.array().map((err) => ({
        field: err.path,
        errMessage: err.msg,
      })),
    });
  }

  try {
    const db = await mongodbConnect();
    const userModel = new User(db);

    const userEmail = await userModel.findUserByEmail(email);

    // checking if users email already exist
    if (userEmail) {
      const error = new Error("user with the email already exist");
      throw error;
    }

    const hashed_pwd = await bcrypt.hash(password, 12);

    //generating Otp
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // grouping user data object
    const userData = {
      fullname: fullname,
      email: email,
      // phone: phone,
      password: hashed_pwd,
      otp: otp,
      otpExpiresAt: otpExpiresAt,
      email_is_verified: false,
      provider: "local",
      googleId: null,
      role: ["buyer"],
      is_vendor_approved: false,
      vendor_profile: null,
      wallet: null,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const result = await userModel.signup(userData);
    if (!result) {
      const error = new Error("creating account failed!");
      error.status = 409;
      throw error;
    }

    const user = await userModel.findUserById(result.insertedId);

    await sendOtpEmail(email, otp);

    res.status(201).json({
      success: true,
      message: "account created succesfuly",
      // userData: user,
    });
  } catch (err) {
    next(err);
  }
};

//email verification
exports.emailVerify = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    const db = await mongodbConnect();
    const userModel = new User(db);

    const user = await userModel.findUserByEmail(email);

    if (!user) {
      const error = new Error('User not found"');
      error.status = 404;
      throw error;
    }

    if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
      const error = new Error("Invalid or expired OTP");
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
  try {
    const db = await mongodbConnect();
    const userModel = new User(db);

    const user = await userModel.findUserByEmail(email);
    // checking if user with the provided email exist
    if (!user) {
      const error = new Error("no user found");
      error.status = 404;
      throw error;
    }

    // checkin if password matches
    const pwdIsMatch = await bcrypt.compare(password, user.password);
    if (!pwdIsMatch) {
      const error = new Error("incorrect password");
      error.status = 401;
      throw error;
    }

    //checking if email is verified befor allowing you to login
    if (!user.email_is_verified) {
      const err = new Error("please verify your email to continue");
      err.status = 403;
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
        expiresIn: "1h",
      }
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
    const db = await mongodbConnect();
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
      }
    );
    console.log(4444, token);

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
    const db = await mongodbConnect();
    const userModel = new User(db);

    const userId = new mongodb.ObjectId(id)

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
  const db = await mongodbConnect();
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
        throw error;
      }
    }

    return res.json({
      success: true,
      message: "Authentication successful",
      token,
      userData: userData,
    });
  } catch (err) {
    console.log(err);
    const error = new Error(" Google authentication failed");
    error.status(401);

    next(error);
  }
};
