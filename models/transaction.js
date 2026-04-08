class Transaction {
  constructor(db) {
    this.collection = db.collection("transactions");
  }

  async fatchAllTransactions() {
    return await this.collection.find({}).toArray();
  }

  async userTransactions(query, page, limit) {
      const skip = (page - 1) * limit;

      return await Promise.all([
        this.collection
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .toArray(),

        this.collection.countDocuments(query),
      ]);
   
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
