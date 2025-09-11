



const express = require("express");
const router = express.Router();

const { adminIsAuth } = require("../../middlewares/admin-auth");

const productController = require("../../controllers/admin/product");



router.delete("/vendor/product-delete", adminIsAuth, productController.adminDeleteProduct);


module.exports = router;
