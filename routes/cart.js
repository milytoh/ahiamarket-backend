const express = require("express");
const router = express.Router();

const { body } = require("express-validator");

const cartController = require("../controllers/cart");
const { isAuth } = require("../middlewares/auth");

router.post(
  "/cart/items",
  body("quantity").notEmpty().withMessage("must have a quantity").isNumeric(),
  isAuth,
  cartController.addToCart  
);
router.get("/cart", isAuth, cartController.getCart);
router.patch("/cart/items/:itemId", isAuth, cartController.updateCartItem);
router.delete("/cart/items/:itemId", isAuth, cartController.deleteCartItem);
router.delete("/cart", isAuth, cartController.deleteCart);

module.exports = router;
