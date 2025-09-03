const bcrypt = require("bcrypt");

const Admin = require("../models/admin/admin");

async function createSupperAdmin() {
  try {
    const mongodbConnect = require("../models/db");

    const { db } = await mongodbConnect();

    const adminModel = new Admin(db);

    const hashedPwd = await bcrypt.hash("legend1234", 12);

    const adminData = {
      name: "nwafor miracle",
      email: "milytohgold@gmail.com",
      password: hashedPwd,
      role: "superAdmin",
      permissions: {
        canManageUsers: true,
        canApproveVendors: true,
        canHandlePayouts: true,
        canDeleteProducts: true,
      },
      lastLogin: new Date(),
      loginHistory: [
        // detailed tracking
        // {
        //   time: ISODate("2025-08-20T09:00:00Z"),
        //   ip: "102.89.23.11",
        //   device: "Windows 10 - Chrome 118",
        //   location: "Lagos, Nigeria",
        // },
        // {
        //   time: ISODate("2025-08-15T15:20:00Z"),
        //   ip: "105.22.76.33",
        //   device: "iPhone 14 - Safari",
        //   location: "Abuja, Nigeria",
        // },
      ],
      status: "active", // active | suspended
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const supperAdmin = await adminModel.createAdmin(adminData);

    console.log("supper admin ceated succesul", supperAdmin);
  } catch (error) {
    console.log(error);
  }
}

createSupperAdmin();
