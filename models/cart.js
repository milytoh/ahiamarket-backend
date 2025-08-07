

class Cart {
  constructor(db) {
    this.collection = db.collection("cart");
  }

  async findCartByUserId(useId) {
    return await this.collection.findOne({ userId: useId });
  }

  async insertCart(cartData) {
    return await this.collection.insertOne(cartData);
  }

  async updateCartByUserId(userId, itemKey, quantity) {
    await this.collection.updateOne(
      { userId: userId },
      {
        $inc: { [itemKey]: quantity },
        $set: { updatedAt: new Date() },
      }
    );
  }

  async pushToCart(userId, item) {
    await this.collection.updateOne(
      { userId: userId },
      {
        $push: {
          items: item,
        },
        $set: { updatedAt: new Date() },
      }
    );
  }
}

module.exports = Cart;
