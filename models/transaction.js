class Transaction {
  constructor(db) {
    this.collection = db.collection("Transactions");
  }

  async createTransaction(transactionData) {
  return await this.collection.createOne({
      ...transactionData,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
}

module.exports = Transaction
