class Wallet {
  constructor(db) {
    this.collection = db.collection("wallets");
  }

  async createWallet(walletDate) {
    return await this.collection.createOne({
      ...walletDate,
      created_at: new Date,
      updated_at: new Date,
    });
  }
}
