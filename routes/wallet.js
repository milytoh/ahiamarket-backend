
const express = require("express");
const router = express.Router();

const walletController = require('../controllers/wallet');
const {isAuth} = require("../middlewares/auth"); 

 router.post("/order", isAuth, walletController.fundWallet)


module.exports = router
