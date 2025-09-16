const express = require("express");
const router = express.Router();

const { adminIsAuth } = require("../../middlewares/admin-auth");

const productController = require("../../controllers/admin/product");
const { body } = require("express-validator");

router.delete(
  "/vendor/product-delete",
  adminIsAuth,
  productController.adminDeleteProduct
);

router.get("/edit-product/:id", adminIsAuth, productController.getEditProduct )

router.patch(
  "/edit-product/:id",
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
  adminIsAuth,
  productController.editProduct
);

module.exports = router;
