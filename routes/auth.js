const express = require("express");
const { body } = require("express-validator");

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
  body("phone")
    .notEmpty()
    .isLength({ min: 10 })
    .withMessage("provide a valid phone number"),
  authController.signup
);
router.post("/login", authController.login);

module.exports = router;
