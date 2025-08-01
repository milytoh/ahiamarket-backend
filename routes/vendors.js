const express = require("express");
const router = express.Router();

const vendorController = require('../controllers/vendor');
const isAuth = require("../middlewares/auth").isAuth; 

router.post('/user/vendor-application', isAuth, vendorController.vendorApplication);


module.exports = router
