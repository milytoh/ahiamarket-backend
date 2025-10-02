const express = require("express");
const router = express.Router();

const followerController = require('../controllers/follower');
const {isAuth} = require("../middlewares/auth"); 

router.post("/vendor/follow", isAuth, followerController.follow)


module.exports = router