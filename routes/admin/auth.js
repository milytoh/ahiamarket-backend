const express = require("express");
const router = express.Router();

const { adminIsAuth } = require("../../middlewares/admin-auth")


const adminAuthController = require("../../controllers/admin/auth");


router.post("/login", adminAuthController.adminLogin);
router.post("/register", adminIsAuth, adminAuthController.createAdmin);
router.delete("/delete", adminIsAuth, adminAuthController.deleteAdmin);

module.exports = router;
