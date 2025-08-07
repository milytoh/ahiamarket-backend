

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

  async updateCartQuantity(userId, itemKey, quantity) {
    await this.collection.updateOne(
      { userId: userId },
      {
        $inc: { [itemKey]: quantity },
        $set: { updatedAt: new Date() },
      }
    );
  }

  async pushToCart(userId, item) {
    return await this.collection.updateOne(
      { userId: userId },
      {
        $push: {
          items: item,
        },
        $set: { updatedAt: new Date() },
      }
    );
  }

  async deleteCartItem(userId, items) {
    return await this.collection.updateOne(
      {
        userId: userId,
      },
      {
        $set: {
          items: items,
        },
      }
    );
  }

  async deleteCartByUserId(userId) {
    await this.collection.deleteOne({userId: userId})
  } 

}

module.exports = Cart;
