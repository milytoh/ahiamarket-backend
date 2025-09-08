class Admin {
  constructor(db) {
    this.collection = db.collection("admins");
  }

  // to create a new admin
  async createAdmin(adminData) {
    return await this.collection.insertOne(adminData);
  }

  //find admin with email
  async findAdminByEmail(email) {
    return await this.collection.findOne({ email: email });
  }

  //find with id
  async findAdminById(id) {
    return await this.collection.findOne({
      _id: id,
    });
  }

  async deleteAdmin(id) {
    return await this.collection.deleteOne({ _id: id });
  }

  async suspendadmin(id) {
    await this.collection.updateOne({ _id: id }, {
      $set: {
        "status": "suspended"
      }
    })
  }
}

module.exports = Admin;
