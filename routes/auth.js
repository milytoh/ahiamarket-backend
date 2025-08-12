const express = require("express");
const { body } = require("express-validator");

const passport = require("passport");

const router = express.Router();

const authController = require("../controllers/auth");

router.post(
  "/signup",
  body("fullname")
    .notEmpty()
    .withMessage("name field must not be empty")
    .trim()
    .isLength({ min: 3 })
    .withMessage("name field must 3 or more charcters"),
  body("email")
    .isEmail()
    .withMessage("please provide a valide email")
    .trim()
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .isAlphanumeric()
    .withMessage("password must contain leters and at least a number ")
    .trim()
    .isLength({ min: 6 })
    .withMessage("password legnth must be 5 characters and above"),

  authController.signup
);
router.post("/login", authController.login);

router.get("/otp/request", authController.otpRequest )

router.post("/email/verify", authController.emailVerify);

router.post("/request-password-reset", authController.requestPasswordReset);

router.patch("/resetPassword", authController.passwordReset);

//google auth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/callback",
  passport.authenticate("google", { session: false, failWithError: true }),
  authController.googleAuth
);

module.exports = router;
