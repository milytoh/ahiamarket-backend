const { ObjectId } = require("mongodb");

const mongodbConnect = require("../models/db");

const {Vendor, VendorApplication}  = require("../models/vendor");

async function vendorApplication() {
  const db = await mongodbConnect();
  return new VendorApplication(db);
}

async function vendorfn() {
  const db = await mongodbConnect();
  return new Vendor(db);
}

// vendor approve
exports.vendorApprove = async (req, res, next) => {
  const vendorId = req.params.id;
  try {
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
   awaitw, vendorApplicationModel.deleteVendorApplicat(applicant._id)
    

    res.status(200).json({
      success: true,
      message: "approved vendor application",
    });
  } catch (err) {
    next(err);
  }
};
