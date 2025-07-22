const express = require("express");

const router = express.Router();

const { isAuth } = require('../middlewares/auth');
const productsController = require('../controllers/products')

router.get('/products', isAuth, productsController.allProducts)

module.exports = router;
