const { ObjectId, MongoClient } = require("mongodb");

const mongodbConnect = require("../models/db");

const Product = require("../models/product");
const Cart = require("../models/cart");
const { ParentOrders, Orders } = require("../models/order");

async function productfn() {
  const { db } = await mongodbConnect();
  return new Product(db);
}

async function cartfn() {
  const { db } = await mongodbConnect();
  return new Cart(db);
}

async function parenOdertfn() {
  const { db } = await mongodbConnect();
  return new ParentOrders(db);
}

async function orderfn() {
  const { db } = await mongodbConnect();
  return new Orders(db);
}

exports.order = async (req, res, next) => {
  const userId = new ObjectId(req.user.userId);
 
  //   const paymentMethod = req.body.payment_method || "direct";

  const productModel = await productfn();
  const cartModel = await cartfn();
  const parentodersModel = await parenOdertfn();
  const orderModel = await orderfn();

  try {
    //  Load cart
    const cart = await cartModel.findCartByUserId(userId);
    if (!cart || cart.items.length === 0) {
      const error = new Error("cart is empty");
      error.status = 400;
      throw error;
    }

    //  Fetch product documents in bulk 
    const productIds = [
      ...new Set(cart.items.map((id) => id.productId.toString())),
    ].map((id) => new ObjectId(id));
 
    const orderProducts = await productModel.findAllById(productIds);

    const productMap = new Map(orderProducts.map((p) => [p._id.toString(),  p]));

    //  Compare prices & check stock -> collect any differences
    const priceChanges = [];
    const outOfStock = [];
    for (const item of cart.items) {
      const prod = productMap.get(item.productId.toString());
      console.log(prod);
      if (!prod) {
        const error = new Error("product not found");
        error.status = 404;
        throw error;
      }

      // stock check (optional)
      if (typeof prod.stock === "number" && prod.stock < item.quantity) {
        outOfStock.push({
          product_id: item.product_id,
          available: prod.stock || 0,
          requested: item.quantity,
        });
      }

      // price compare: cart stores price_at_time (when added). product.price is current.
      const cartPrice = item.priceAtTime;
      const currentPrice = prod.price;
      if (cartPrice !== currentPrice) {
        priceChanges.push({
          product_id: item.product_id,
          title: prod.title || prod.name || "",
          old_price: cartPrice,
          new_price: currentPrice,
        });
      }
    }

    if (outOfStock.length < 0) {
      const error = new Error("some items are out of stock", outOfStock);
      error.status = 409;
      throw error;
    }

    //  If there are price changes and user hasn't confirmed, return 409 with details
    if (priceChanges.length < 0) {
      //  const session = client.startSession();
      const error = new Error(
        "Some item prices changed. Please confirm to continue."
      );

      error.status = 409;
      throw error;
    }

    //Proceed to create parent order + vendor orders
    //    Use current product.price as authoritative at purchase time (price_at_purchase).
    //    Use transaction for atomicity (requires replica set or Atlas).

    // starting transaction
    const { client } = await mongodbConnect();
    const session = client.startSession();
    session.startTransaction();

    function groupItemsByVendor(items) {
      // items: [{ product_id, vendor_id, quantity, price_at_time }]
      const map = new Map();
      for (const item of items) {
        const key = item.vendorId.toString();
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
      }

      return map;
    }

    const vendorMap = groupItemsByVendor(cart.items);
    

    let parentTotal = 0;
    const vendorOrdersRefs = []; // to build vendor_orders array for parent doc

    // 5a) Create parent order doc (payment pending)
    const parentDoc = {
      buyerId: userId,
      vendor_orders: [], // will fill after child orders created
      payment: {
        method: "direct",
        status: "pending",
        transaction_ref: null,
      },
      delivery: {
        address: cart.delivery_address || "", // user-selected address
        status: "pending",
      },
      total: 0,
      order_status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    };

    const parentOrder = await parentodersModel.insertToOder(parentDoc, session);

    const parentOrderId = parentOrder.insertedId;

/////////////    //  For each vendor group create a child order
    for (const [vendorIdStr, items] of vendorMap.entries()) {
      const vendorId = new ObjectId(vendorIdStr);
      const childProducts = [];
      let subtotal = 0;

      for (const it of items) {
        const prod = productMap.get(it.productId.toString());
        const priceAtPurchase = prod.price; // authoritative current price

        // compute line total
        const lineTotal = priceAtPurchase * it.quantity;
        subtotal += lineTotal;

        childProducts.push({
          productId: new ObjectId(it.productId),
          quantity: it.quantity,
          priceAtPurchase,
        });
      }

      // Example shipping calculation / fees (customize)
      const shippingFee = 0; // compute per vendor as needed
      const totalForVendor = subtotal + shippingFee;

      const childOrderData = {
        parent_order_id: parentOrderId,
        buyer_id: new ObjectId(userId),
        vendor_id: vendorId,
        products: childProducts,
        payment: {
          method: "direct",
          status: "pending",
          transaction_ref: null,
        },
        delivery: {
          address: cart.delivery_address || "",
          assigned_agent: null,
          status: "pending",
          estimated_date: null,
        },
        subtotal,
        shipping_fee: shippingFee,
        total: totalForVendor,
        order_status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const childOrder = await orderModel.createOrder(childOrderData, session);
      const childOrderId = childOrder.insertedId;

      // Add to parent vendor_orders array
      vendorOrdersRefs.push({
        vendor_id: vendorId,
        order_id: childOrderId,
        subtotal,
      });

      parentTotal += totalForVendor;
    }

    //Update parent with vendor_orders and total

    await parentodersModel.updateParentOrder(
      parentOrderId,
      vendorOrdersRefs,
      parentTotal,
      session
    );



    // 5e) Clear user's cart (or remove the items that were checked out)
    await cartModel.updateCart(userId, []);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Checkout successful (orders created). Proceed to payment.",
      vendor_orders: vendorOrdersRefs,
      total: parentTotal,
    });
  } catch (error) {
     await session.abortTransaction();
      session.endSession();
    next(error);
  }
};
