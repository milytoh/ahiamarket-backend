class Follower {
  constructor(db) {
    this.collecion = db.collection("followers");
  }

  async followVendor(follower) {
    return await this.collecion.insertOne(follower);
  }

  async findFollower(userId, vendorId) {
    return await this.collecion.findOne({
      user: userId,
      vendor: vendorId,
    });
  }

  async unfollowVendor(userId, vendorId) {
    return await this.collecion.deleteOne ({
      user: userId,
      vendor: vendorId,
    });
  }
}

module.exports = Follower;
