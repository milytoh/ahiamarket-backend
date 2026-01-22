const express = require("express");
const { body } = require("express-validator");

const passport = require("passport");

const router = express.Router();

const authController = require("../controllers/auth");

router.post(
  "/signup",
  body("fullName")
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
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
    .withMessage(
      "Password must include uppercase, lowercase, number and special character"
    ),

  authController.signup
);
router.post(
  "/login",
  body("email")
    .isEmail()
    .withMessage("please provide a valide email")
    .trim()
    .normalizeEmail(),
  authController.login
);

router.get("/otp/request", authController.otpRequest);

router.post(
  "/email/verify",
  body("email")
    .isEmail()
    .withMessage("please provide a valide email")
    .trim()
    .normalizeEmail(),
  authController.emailVerify
);

router.post("/request-password-reset",  body("email")
    .isEmail()
    .withMessage("please provide a valide email")
    .trim()
    .normalizeEmail(), authController.requestPasswordReset); 

router.patch(
  "/resetPassword",
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
    .withMessage(
      "Password must include uppercase, lowercase, number and special character",
    ),
  authController.passwordReset,
);

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
