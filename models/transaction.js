class Transaction {
  constructor(db) {
    this.collection = db.collection("transactions");
  }

  async createTransaction(transactionData) {
    return await this.collection.insertOne({
      ...transactionData,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  async updateTransaction(reference, updateData) {
    await this.collection.updateOne(
      { reference: reference },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      }
    );
  }
}

module.exports = Transaction;
