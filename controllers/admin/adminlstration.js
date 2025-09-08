const { ObjectId } = require("mongodb");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const mongodbConnect = require("../../models/db");
const Admin = require("../../models/admin/admin");
const User = require("../../models/user");
const { Vendor, VendorApplication } = require("../../models/vendor");
const Wallet = require("../../models/wallet");
const { ParentOrders } = require("../../models/order");

async function adminfn() {
  const { db } = await mongodbConnect();
  return new Admin(db);
}

async function userfn() {
  const { db } = await mongodbConnect();
  return new User(db);
}

async function vendorfn() {
  const { db } = await mongodbConnect();
  return new Vendor(db);
}

async function walletfn() {
  const { db } = await mongodbConnect();
  return new Wallet(db);
}

async function parentOderfn() {
  const { db } = await mongodbConnect();
  return new ParentOrders(db);
}

// vendor approve
exports.vendorApprove = async (req, res, next) => {
  const vendorId = req.params.id;
  const adminId = new ObjectId(req.admin.adminId);

  const walletModel = await walletfn();
  const adminModel = await adminfn();

  try {
    //checking admin permission to approve vendor application
    const admin = await adminModel.findAdminById(adminId);
    if (admin.role !== "superAdmin" && !admin.permissions.canManageUsers) {
      const error = new Error("unauthorize, permission not granted");
      error.status = 403;
      throw error;
    }

    const id = new ObjectId(vendorId);
    const vendorApplicationModel = await vendorApplication();
    const applicant = await vendorApplicationModel.findbVendorApplicationById(
      id
    );

    // checking if application is a valid one
    if (!applicant) {
      const error = new Error("vendor application not found");
      error.status = 404;
      throw error;
    }

    // updating vendor application as approved
    await vendorApplicationModel.updateVendorApplication(
      applicant._id,
      "approved"
    );

    const approvedVendor =
      await vendorApplicationModel.findbVendorApplicationById(applicant._id);

    const vendorModel = await vendorfn();
    //insert approved vendor into vendors collections
    await vendorModel.createVendor(approvedVendor);

    //delete vendor from vendor application database
    await vendorApplicationModel.deleteVendorApplicat(applicant._id);

    await walletModel.updateWlletByOwnerId(new ObjectId(vendorId), {
      ownerType: "vendor",
    });

    res.status(200).json({
      success: true,
      message: "approved vendor application",
    });
  } catch (err) {
    next(err);
  }
};

// deleting admin
exports.deleteAdmin = async (req, res, next) => {
  const superAdminId = new ObjectId(req.admin.adminId);
  const adminId = new ObjectId(req.body.adminId);
  try {
    const adminModel = await adminfn();

    // checkin and making sure that only supper Admin can delete Admin
    const superAdmin = await adminModel.findAdminById(superAdminId);
    if (superAdmin?.role !== "superAdmin") {
      const error = new Error("unauthorize, only super admin can delete Admin");
      error.status = 403;
      throw error;
    }

    const admin = await adminModel.findAdminById(adminId);
    if (!admin) {
      const error = new Error("Admin not found");
      error.status = 404;
      throw error;
    }

    await adminModel.deleteAdmin(admin._id);

    res.status(200).json({
      success: true,
      message: `Admin deleted ${admin.name}`,
    });
  } catch (error) {
    next(error);
  }
};

exports.suspendAdmin = async (req, res, next) => {
  const adminId = new ObjectId(req.admin.adminId);
  const suspendAdminId = new ObjectId(req.body.adminId);
  try {
    const adminModel = await adminfn();

    // checkin and making sure that only supper Admin can delete Admin
    const admin = await adminModel.findAdminById(adminId);

    if (admin?.role !== "superAdmin") {
      const error = new Error("unauthorize, ");
      error.status = 403;
      throw error;
    }

    const suspendAdmin = await adminModel.findAdminById(suspendAdminId);
    if (!suspendAdmin) {
      const error = new Error("Admin not found");
      error.status = 404;
      throw error;
    }

    await adminModel.suspendadmin(suspendAdmin._id);

    res.status(200).json({
      success: true,
      message: `Admin ${suspendAdmin.name} has been susspended`,
    });
  } catch (error) {
    next(error);
  }
};

exports.chengeStatus = async (req, res, next) => {
  const adminId = new ObjectId(req.admin.adminId);
  const userId = new ObjectId(req.body.userId);
  const state = req.body.state;
  const reason = req.body.reason;
  const suspended_until = req.body.suspended_until;

  try {
    const adminModel = await adminfn();
    const userModel = await userfn();

    //checking admin permission to delete users account
    const admin = await adminModel.findAdminById(adminId);
    if (admin.role !== "superAdmin" && !admin.permissions.canManageUsers) {
      const error = new Error("unauthorize, permission not granted");
      error.status = 403;
      throw error;
    }

    //find a use acct
    const user = await userModel.findUserById(userId);
    if (!user) {
      const error = new Error("user account not found");
      error.status = 404;
      throw error;
    }

    const suspendedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const statusData = {
      status: {
        state,
        reason,
        suspended_until: suspendedUntil,
        updated_at: new Date(),
      },
    };
    //  "active" | "suspended" | "banned",

    await userModel.updateStatus(user._id, statusData);

    res.status(200).json({
      success: true,
      message: `user account have been ${state}, contact us for more info`,
    });
  } catch (error) {
    next(error);
  }
};

//Order Oversight → Track pending, delivered, disputed orders.
exports.fetchAllOrders = async (req, res, next) => {
  const adminId = new ObjectId(req.admin.adminId);
  try {
    const adminModel = await adminfn();
    const parentOderModel = await parentOderfn();

    //checking admin permission to delete users account
    const admin = await adminModel.findAdminById(adminId);
    if (admin.role !== "superAdmin" && !admin.permissions.canManageUsers) {
      const error = new Error("unauthorize, permission not granted");
      error.status = 403;
      throw error;
    }
  } catch (error) {
    next(error);
  }
};
