class Product {
  constructor(db) {
    this.collection = db.collection("products");
  }

  async createProduct(productData) {
    await this.collection.insertOne(productData);
  }

  async findAllProducts(idArray) {
    return await this.collection
      .find({
        _id: { $in: [idArray] },
      })
      .toArray();
  }

  //
  async findProductsByVendorId(vendorId, skip, limit, filters) {
    const query = { vendorId };

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
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    const totalProducts = await this.collection.countDocuments({
      vendorId: vendorId,
    });
    return { products, totalProducts };
  }

  async findProductById(id, userId) {
    return await this.collection.findOne({ _id: id, vendorId: userId });
  }

  async deleteProductById(id, vendorId) {
    return await this.collection.deleteOne({ _id: id, vendorId: vendorId });
  }

  async updateProduct(productId, vendorId, updatedProductData) {
    return await this.collection.updateOne(
      {
        $and: [{ _id: productId }, { vendorId: vendorId }],
      },
      {
        $set: updatedProductData,
      },
    );
  }

  async findAllById(id) {
    return await this.collection
      .find({
        _id: { $in: [...id] },
      })
      .toArray();
  }

  async podUpdate(id, pod, vendorId) {
   
    return await this.collection.updateOne(
      {
        $and: [{ _id: id }, { vendorId: vendorId }],
      },
      {
        $set: { pod: pod },
      },
    );
  }

  async visibleUpdate(id, visible, vendorId) {
    return await this.collection.updateOne(
      {
        $and: [{ _id: id }, { vendorId: vendorId }],
      },
      {
        $set: { visible: visible },
      },
    );
  }

  async findImgBeforeDelete(productId, image) { 
   return  await this.collection.findOne({
        _id: { $ne: productId },
        images: image,
      });
  }
}

module.exports = Product;
    