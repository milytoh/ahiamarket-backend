const express = require("express");
const router = express.Router();

const cartController = require('../controllers/cart');
const {isAuth} = require("../middlewares/auth"); 

router.post("/cart/items", isAuth, cartController.addToCart);


module.exports = router
