class Product {
  constructor(db) {
    this.collection = db.collection("products");
  }

  async createProduct(productData) {
    await this.collection.insertOne(productData)
  }

  async findAllProducts(idArray) {
    return await this.collection.find({
      _id: {$in: [idArray]}
    }).toArray();
  }


  async findProductsByVendorId(vendorId, skip, limit, filters) {
       const query = { vendorId };

       console.log( limit, filters)

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }


  if (filters.startDate || filters.endDate) {
    query.created_at = {};

    if (filters.startDate) {
      query.created_at.$gte = new Date(filters.startDate);
    }

    if (filters.endDate) {
      query.created_at.$lte = new Date(filters.endDate);
    }
  }

    const products = await this.collection
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();
    const totalProducts = await this.collection.countDocuments({ vendorId: vendorId });
    return { products, totalProducts };
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

  async findAllById(id) {
    return await this.collection
      .find({
        _id: { $in: [...id] },
      })
      .toArray();
  }
}

module.exports = Product;
