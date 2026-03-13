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
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(Number(limit))
          .toArray(),

        this.collection.countDocuments(query),
      ]);
    // return await this.collection
    //   .find(query)
    //   .sort({ created_at: -1 })
    //   .skip((page - 1) * limit)
    //   .limit(Number(limit))
    //   .toArray();
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
