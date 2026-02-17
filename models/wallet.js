class Wallet {
  constructor(db) {
    this.collection = db.collection("wallets");
  }

  async createWallet(walletDate) {
    const wallet = await this.collection.insertOne({
      ...walletDate,
      created_at: new Date(),
      updated_at: new Date(),
    });

    ////remove this
    // await this.createIndex({ ownerId: 1 });

    return wallet;
  }

  async findWalletByOwnerId(ownerId) {
    return await this.collection.findOne({
      ownerId,
    });
  }

  async updateWalletPrice(userId, depositeAmount) {
    return await this.collection.updateOne(
      {
        ownerId: userId,
      },
      {
        $inc: { balance: depositeAmount },
        $set: {
          updated_at: new Date(),
        },
      },
    );
  }

  async updateWlletByOwnerId(ownerId, updateData) {
    await this.collection.updateOne(
      { ownerId: ownerId },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      },
    );
  }
}

module.exports = Wallet;
