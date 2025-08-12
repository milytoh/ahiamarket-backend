const express = require("express");

const { body } = require("express-validator");

const router = express.Router();

const vendorController = require("../controllers/vendor");
const isAuth = require("../middlewares/auth").isAuth;

router.post(
  "/user/vendor-application",
  body("storename")
    .notEmpty()
    .withMessage("store name should not be empty")
    .isLength({ min: 3 })
    .withMessage("store name must be upto 3 characters"),
  body("bio")
    .notEmpty()
    .withMessage("bio field must not be empty")
    .isLength({ min: 15, max: 600 })
    .withMessage(
      "bio field must be at least 15 characters at most 600 characters"
  ),
  body("address").notEmpty().withMessage("provide a valid address"),
  body("state").notEmpty().withMessage("provide state field"),
  body("city").notEmpty().withMessage("city field must not be empty"),
  isAuth,
  vendorController.vendorApplication
);
router.post(
  "/vendor/create-product",
  body("name")
    .notEmpty()
    .withMessage("name field must not be empty")
    .isLength({ min: 3 })
    .withMessage("name must be 3 or more characters")
    .trim(),
  body("description")
    .notEmpty()
    .withMessage("field must not be empty")
    .isLength({ min: 15 })
    .withMessage("description must be 15 or more charactershb")
    .trim(),
  body("price")
    .notEmpty()
    .withMessage("must not be empty")
    .isNumeric("must be number")
    .trim(),
  body("condition").notEmpty().withMessage("field must not be empty").trim(),
  body("category")
    .notEmpty()
    .withMessage("category field must not be empty ")
    .trim(),
  body("stock").notEmpty().withMessage("sock field must not be empty").trim(),
  body("tags").notEmpty().withMessage("must have a tag").trim(),
  isAuth,
  vendorController.createProduct
);

module.exports = router;
