const { ObjectId } = require("mongodb");

const mongodbConnect = require("../models/db");

const VendorApplications = require("../models/vendor");

async function vendorApplication() {
  const db = await mongodbConnect();
  return new VendorApplications(db);
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

    await vendorApplicationModel.updateVendorApplication(
      applicant._id,
      "approved"
    );

    res.status(200).json({
      success: true,
      message: "approved vendor application",
    });
  } catch (err) {
    next(err);
  }
};
