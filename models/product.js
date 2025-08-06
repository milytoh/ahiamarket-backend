class Product {
  constructor(db) {
    this.collection = db.collection("products");
  }

  async findAllProducts() {
    return await this.collection.find({}).toArray();
  }

  async findProductById(id) {
    return await this.collection.findOne({ _id: id });
  }

  async deleteProductById(id) {
    return await this.collection.deleteOne({ _id: id });
  }

  async updateProduct(productId, vendorId, updatedProductData) {
  return await this.collection.updateOne(
      {
        $and: [{ _id: productId }, { vendorId: vendorId }],
      },
      {
        $set: updatedProductData,
      }
    );
  }
}

module.exports = Product;
