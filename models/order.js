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

  async updateParentOrderById(id, data, reference, orderStatus) {
    return await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          "payment.status": data,
          "payment.transaction_ref": reference,
          order_status: orderStatus,
          updated_at: new Date(),
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

  async updateManyByParantOrderId(id,data,reference, orderStatus) {
    await this.collection.updateMany(
      { parent_order_id: id },
      {
        $set: {
          "payment.status": data,
          "payment.transaction_ref": reference,
          order_status: orderStatus,
          updated_at: new Date(),
        },
      }
    );
  }
}

module.exports = { ParentOrders, Orders };
