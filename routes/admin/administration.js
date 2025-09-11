const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

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

router.get(
  "/transactions",
  adminIsAuth,
  adminAdminstrationController.transactions
);

router.get(
  "/orders/totalsales",
  body("fromDate").trim().isDate().withMessage("provide a valid date"),
  // body("toDate").trim().isDate().withMessage("provide a valid date"),
  // body("")
  adminIsAuth,
  adminAdminstrationController.totalSales
);

module.exports = router;
