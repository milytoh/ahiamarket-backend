const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cart");
const { isAuth } = require("../middlewares/auth");

router.post("/cart/items", isAuth, cartController.addToCart);
router.get("/cart", isAuth, cartController.getCart);
router.patch("/cart/items/:itemId", isAuth, cartController.updateCartItem);
router.delete("/cart/items/:itemId", isAuth);

module.exports = router;
