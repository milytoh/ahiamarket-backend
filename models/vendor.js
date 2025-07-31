class VendorApplications {
  constructor(db) {
    this.collection = db.collection("vendorApplication");
  }

  async applyVendor(vendorData) {
    const vendorApplicant = await this.collection.insertOne(vendorData);

    return vendorApplicant;
  }

  async findVendorByUserId(id) {
    const vendor = await this.collection.findOne({ userId: id });
    return vendor;
  }
}

module.exports = VendorApplications;
