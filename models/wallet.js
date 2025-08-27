class Wallet {
  constructor(db) {
    this.collection = db.collection("wallets");
  }

  async createWallet(walletDate) {
    return await this.collection.createOne({
      ...walletDate,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  async findWalletByOwnerId(ownerId) {
    return await this.collection.findOne({
      ownerId,
    });
  }

  async updateWallet(userId, depositeAmount) {
    return await this.collection.updateOne({
      ownerId: userId,
    }, {
      $in: {balance: depositeAmount},
      $set: {
      updated_at: new Date()
    }});
  }
}

module.exports = Wallet;
