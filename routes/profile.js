const express = require("express");
const router = express.Router();

const { isAuth } = require("../middlewares/auth");

const profileController = require("../controllers/profile.js");

router.get("/profile", isAuth, profileController.getUserProfile);

module.exports = router;
