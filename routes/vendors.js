const express = require("express");

const { body } = require("express-validator");

const router = express.Router();

const vendorController = require("../controllers/vendor");
const isAuth = require("../middlewares/auth").isAuth;

router.post(
  "/user/vendor-application",
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
  body("condition").notEmpty("field must not be empty"),
  body("category").notEmpty("category field must not be empty "),
  body("stock").notEmpty("sock field must not be empty"),
  body("tags").notEmpty("must have a tag"),
  isAuth,
  vendorController.vendorApplication
);
router.post("/vendor/create-product", isAuth, vendorController.createProduct);

module.exports = router;
