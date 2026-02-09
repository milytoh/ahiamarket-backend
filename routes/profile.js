const express = require("express");
const router = express.Router();

const { isAuth } = require("../middlewares/auth");

const profileController = require("../controllers/profile.js");

router.get("/profile", isAuth, profileController.getUserProfile);
router.get("/profile/wallet", isAuth, profileController.wallet);

module.exports = router;
