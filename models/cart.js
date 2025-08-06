class Cart {
  constructor(db) {
    this.collection = db.collection("Cart");
  }

  async findCartByUserId(id) {
    return await this.collection.findOne({ _id: id });
  }

  async insertCart( cartData) {
    return await this.collection.insertOne(
      cartData
    )
  }

  async updateCartByUserId(userId,itemKey, quantity) {
    await this.collection.updateOne(
      { userId: userId },
      {
        $inc: { [itemKey]: quantity },
        $set: { updatedAt: new Date() },
      }
    );
  }
}

module.exports = Cart;
