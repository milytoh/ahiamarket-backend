const { ObjectId } = require("mongodb");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Admin = require("../../models/admin/admin");
const mongodbConnect = require("../../models/db");

async function adminfn() {
  const { db } = await mongodbConnect();
  return new Admin(db);
}

// creating an admin
exports.createAdmin = async (req, res, next) => {
  const { name, email, password, role, permissions } = req.body;

  const adminId = new ObjectId(req.admin.adminId);

  try {
    const adminModel = await adminfn();

    const admin = await adminModel.findAdminById(adminId);
    console.log(admin);
    // making sure only supper admin can create admins
    if (admin.role !== "superAdmin") {
      const error = new Error(
        "unauthorize access, only supper Admin can create other Admins"
      );
      error.status = 403;
      throw error;
    }

    // checking if email already exist on the db
    const adminEmail = await adminModel.findAdminByEmail(email);
    if (adminEmail) {
      const error = new Error("Admin with same email already exist");
      error.status = 409;
      throw error;
    }

    // hashing password
    const hashedPwd = await bcrypt.hash(password, 12);

    const adminData = {
      name: name,
      email: email,
      password: hashedPwd,
      role: role,
      permissions: {
        canManageUsers: permissions?.canManageUsers,
        canApproveVendors: permissions?.canApproveVendors,
        canHandlePayouts: permissions?.canHandlePayouts,
        canDeleteProducts: permissions?.canDeleteProducts,
      },
      lastLogin: new Date(),
      loginHistory: [],
      status: "active", // active | suspended
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminModel.createAdmin(adminData);
    res.status(201).json({
      success: true,
      message: "Admin created succesful",
    });
  } catch (error) {
    next(error);
  }
};

/// admin login
exports.adminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const adminModel = await adminfn();

    // checking for admin email
    const admin = await adminModel.findAdminByEmail(email);

    if (!admin) {
      const error = new Error("Admin with this email do not exist");
      error.status = 404;
      throw error;
    }

    ///checking if the passwoed is correct
    const pwdMatch = await bcrypt.compare(password, admin.password);
    if (!pwdMatch) {
      const error = new Error("incorrect password");
      error.status = 401;
      throw error;
    }

    const jwt_secret = process.env.JWT_SECRET;
    // generating a jwtoken
    const token = jwt.sign(
      {
        adminId: admin._id,
        email: admin.email,
      },
      jwt_secret,
      {
        expiresIn: "6h",
      }
    );

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
    });
  } catch (error) {
    next(error);
  }
};

