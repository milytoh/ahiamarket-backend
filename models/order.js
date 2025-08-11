class ParentOrders {
  constructor(db) {
    this.collection = db.collection("parent_orders");
  }

  async insertToOder(parentOder, session) {
    return await this.collection.insertOne(parentOder, { session });
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
}

class Orders {
  constructor(db) {
    this.collection = db.collection("orders");
  }

  async createOrder(orderData, session) {
    return await this.collection.insertOne(orderData, { session });
  }
}

module.exports = { ParentOrders, Orders };
