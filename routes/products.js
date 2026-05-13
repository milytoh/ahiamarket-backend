const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const { isAuth } = require("../middlewares/auth");
const productsController = require("../controllers/product");
const upload = require("../middlewares/upload");
const validateUpdateImages = require("../utils/updateProductImgValidate");

router.get("/products", isAuth, productsController.allProducts);
router.get("/product/:id/details", isAuth, productsController.productDetails);
router.delete("/product/:id/delete", isAuth, productsController.deleteProduct);
router.post(
  "/vendor/product/clone",
  isAuth,
  productsController.cloneProduct,
);

router.get(
  "/vendor/product/:id/update",
  isAuth,
  productsController.getUpdateProduct,
);
router.put(
  "/vendor/product/:id/update",
  upload.array("images", 3),
  body("productName")
    .notEmpty()
    .withMessage("name field must not be empty")
    .isLength({ min: 3 })
    .withMessage("name must be 3 or more characters")
    .trim(),
  body("description")
    .notEmpty()
    .withMessage("field must not be empty")
    .isLength({ min: 20, max: 1000 })
    .withMessage("description must be 15 or more charactershb")
    .trim(),

  body("unitPrice")
    .notEmpty()
    .withMessage("must not be empty")
    .isNumeric("must be number")
    .trim(),
  body("condition").notEmpty().withMessage("field must not be empty").trim(),
  body("status").notEmpty().withMessage("field must not be empty").trim(),
  body("category")
    .notEmpty()
    .withMessage("category field must not be empty ")
    .trim(),
  body("stock").notEmpty().withMessage("sock field must not be empty").trim(),
  // body("tags").notEmpty().withMessage("must have a tag").trim(),
  body("podEnabled")
    .toBoolean()
    .isBoolean()
    .withMessage("paid on delivery must be a boolean"),
  validateUpdateImages,
  isAuth,
  productsController.updateProduct,
);
router.get("/vendor/products", isAuth, productsController.vendorProducts);

module.exports = router;
