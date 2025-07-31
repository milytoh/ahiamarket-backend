const express = require("express");
const router = express.Router();


const isAuth = require("../middlewares/auth").isAuth; 
const adminController = require('../controllers/admin')

router.post('/vendors/applications/:id/approve', adminController.vendorApprove)


module.exports = router

