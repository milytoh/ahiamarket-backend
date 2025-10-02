const express = require("express");
const router = express.Router();

 const orderController = require('../controllers/order');
const {isAuth} = require("../middlewares/auth"); 

 router.post("/order", isAuth, orderController.order)


module.exports = router
