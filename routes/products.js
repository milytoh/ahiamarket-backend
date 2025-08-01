const express = require("express");

const router = express.Router();

const { isAuth } = require('../middlewares/auth');
const productsController = require('../controllers/product');



router.get('/products', isAuth, productsController.allProducts)

module.exports = router;
