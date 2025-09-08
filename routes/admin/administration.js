const express = require("express");
const router = express.Router();

const { adminIsAuth } = require("../../middlewares/admin-auth");

const adminAdminstrationController = require("../../controllers/admin/adminlstration");

router.post(
  "/vendors/applications/:id/approve",
  adminIsAuth,
  adminAdminstrationController.vendorApprove
);
router.delete("/delete", adminIsAuth, adminAdminstrationController.deleteAdmin);
router.patch(
  "/suspend",
  adminIsAuth,
  adminAdminstrationController.suspendAdmin
);
router.patch(
  "/user/update-status",
  adminIsAuth,
  adminAdminstrationController.chengeStatus
);
router.get("/orders", adminIsAuth, adminAdminstrationController.fetchAllOrders);

module.exports = router;
