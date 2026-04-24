const express = require("express");

const { body } = require("express-validator");

const router = express.Router();
const vendorController = require("../controllers/vendor");
const isAuth = require("../middlewares/auth").isAuth;
const upload = require("../middlewares/upload");
const validateImages = require("../utils/productValidateImages");

router.post(
  "/user/vendor-application",
  body("storeNameIdentity")
    .notEmpty()
    .withMessage("store name should not be empty")
    .isLength({ min: 3 })
    .withMessage("store name must be upto 3 characters"),
  body("storeBioIdentity")
    .notEmpty()
    .withMessage("bio field must not be empty")
    .isLength({ min: 20, max: 600 })
    .withMessage(
      "bio field must be at least 20 characters at most 600 characters",
    ),
  body("address").notEmpty().withMessage("provide a valid address"),
  body("state").notEmpty().withMessage("provide state field"),
  body("city").notEmpty().withMessage("city field must not be empty"),

  isAuth,
  vendorController.vendorApplication,
);
router.post(
  "/vendor/create-product",
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
  validateImages,
  // body("images").custom((_, { req }) => {
  //   const files = req.files;

  //   console.log(files)

  //   if (!files || files.length === 0) {
  //     throw new Error("Please upload at least one image.");
  //   }

  //   if (files.length > 3) {
  //     throw new Error("Maximum 3 images allowed.");
  //   }

  //   const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  //   const invalidFiles = files.filter(
  //     (file) => !allowedTypes.includes(file.mimetype),
  //   );

  //   if (invalidFiles.length > 0) {
  //     throw new Error("Only JPG, PNG, or WEBP allowed.");
  //   }

  //   return true;
  // }),
  isAuth,
  vendorController.createProduct,
);

router.get(
  "/vendor/dashboard/overview",
  isAuth,
  vendorController.getDashboardOverview,
);

module.exports = router;
