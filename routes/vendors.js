const express = require("express");
const router = express.Router();

const vendorController = require('../controllers/vendor');
const isAuth = require("../middlewares/auth").isAuth; 

router.post('/user/vendor-application', isAuth, vendorController.vendorApplication);
router.post('/vendor/create-product', isAuth, vendorController.createProduct )


module.exports = router
