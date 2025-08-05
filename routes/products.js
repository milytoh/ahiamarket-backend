const express = require("express");

const router = express.Router();

const { isAuth } = require("../middlewares/auth");
const productsController = require("../controllers/product");

router.get("/products", isAuth, productsController.allProducts);
router.get("/product/:id/details", isAuth, productsController.productDetails);
router.delete("/product/:id/delete",isAuth,productsController.deleteProduct )

module.exports = router;
