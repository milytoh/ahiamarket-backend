class ParentOrders {
  constructor(db) {
    this.collection = db.collection("parent_orders");
  }

  async insertToOder(parentOder, session) {
    return await this.collection.insertOne(parentOder, { session });
  }

  async findParentOrderById(id) {
    return await this.collection.findOne({ _id: id });
  }

  async updateParentOrder(
    parentOrderId,
    vendorOrdersRefs,
    parentTotal,
    session
  ) {
    return await this.collection.updateOne(
      { _id: parentOrderId },
      {
        $set: {
          vendor_orders: vendorOrdersRefs,
          total: parentTotal,
          updated_at: new Date(),
        },
      },
      { session }
    );
  }

  async updateParentOrderById(id, updateData, session) {
    return await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          ...updateData,
          updated_at: new Date(),
        },
      },{session}
     
    );
  }
}

class Orders {
  constructor(db) {
    this.collection = db.collection("orders");
  }

  async createOrder(orderData, session) {
    return await this.collection.insertOne(orderData, { session });
  }

  async findByVendorOrderId(id) {
    return await this.collection
      .findOne({
        _id: id,
      })
      ;
  }

  async updateManyByParantOrderId(id, updateData, session) {
    await this.collection.updateMany(
      { parent_order_id: id },
      {
         $set: {
          ...updateData,
          updated_at: new Date(),
        },
      }, {session}
    );
  }
  async updateVendorOrder(id, data, session) {
    await this.collection.updateOne(
      { _id: id },
      {
        $set: data,
      }, {session}
    );
  }
}

module.exports = { ParentOrders, Orders };
