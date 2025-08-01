

class VendorApplication {
  constructor(db) {
    this.collection = db.collection("vendorApplications");
  }

  async applyVendor(vendorData) {
    const vendorApplicant = await this.collection.insertOne(vendorData);

    return vendorApplicant;
  }

  async findVendorByUserId(id) {
    const vendor = await this.collection.findOne({ userId: id });
    return vendor;
  }

  async findbVendorApplicationById(id) {
    return await this.collection.findOne({ _id: id });
  }

  async updateVendorApplication(id, status) {
    return await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          "verification.verified_at": Date.now(),
          "verification.status": status,
        },
      }
    );
  }

  async deleteVendorApplicat(id) {
    await this.collection.deleteOne({ _id: id });
  }
}

class Vendor extends VendorApplication  {
  constructor(db) {
    super(db)
    this.collection = db.collection("vendors");
  }

  async createVendor(vendorData) {
    return await this.collection.insertOne(vendorData);
  }
}

module.exports = { VendorApplication, Vendor  };
