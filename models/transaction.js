class Transaction {
  constructor(db) {
    this.collection = db.collection("transactions");
  }

  async fatchAllTransactions() {
    return await this.collection.find({}).toArray();
  }

  async userTransactions(query, page, limit ) {
    return await this.collection
      .find()
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .toArray();
  }

  async createTransaction(transactionData) {
    return await this.collection.insertOne({
      ...transactionData,
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
      },
    );
  }
}

module.exports = Transaction;
