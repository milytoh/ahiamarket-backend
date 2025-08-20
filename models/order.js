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

  async updateParentOrderById(id, data, reference) {
  return  await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          "payment.status": data,
          "payment.transaction_ref": reference,
          updated_at: new Date()
        },
      }
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
