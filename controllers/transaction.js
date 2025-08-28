const { ObjectId, MongoClient } = require("mongodb");

require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

const { Orders, ParentOrders } = require("../models/order");
const User = require("../models/user");
const Payment = require("../models/payment");
const { Vendor } = require("../models/vendor");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");

const mongodbConnect = require("../models/db");

async function parentOrderfn() {
  const { db } = await mongodbConnect();
  return new ParentOrders(db);
}

async function userfn() {
  const { db } = await mongodbConnect();
  return new User(db);
}

async function paymentfn() {
  const { db } = await mongodbConnect();
  return new Payment(db);
}

async function orderfn() {
  const { db } = await mongodbConnect();
  return new Orders(db);
}

async function vendorfn() {
  const { db } = await mongodbConnect();
  return new Vendor(db);
}

async function walletfn() {
  const { db } = await mongodbConnect();
  return new Wallet(db);
}

async function transactionfn() {
  const { db } = await mongodbConnect();
  return new Transaction(db);
}

exports.directPayment = async (req, res, next) => {
  const parent_orderId = new ObjectId(req.params.parentOrderId);

  const parentOrderModel = await parentOrderfn();
  const userModel = await userfn();

  const userId = new ObjectId(req.user.userId);

  const parenOrder = await parentOrderModel.findParentOrderById(parent_orderId);
  try {
    // //checking if amout is a number
    // if (!Number.isInteger(amount) || amount <= 0) {
    //   const error = new Error("provide valide number");
    //   error.status = 400;
    //   throw error;
    // }
    if (!parenOrder) {
      const error = new Error("no product found");
      error.status = 404;
      throw error;
    }

    const user = await userModel.findUserById(userId);

    if (!user) {
      const error = new Error("user not found");
      error.status = 404;
      throw error;
    }

    const reference = `ord-${parenOrder._id.toString()}-${
      user._id
    }-${Date.now()}`;

    const resp = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: parenOrder.total * 100, // kobo
        callback_url: process.env.CALLBACK_URL,
        reference,
        metadata: {
          type: "direct_payment",
          parent_order_id: parenOrder._id,
          buyer_id: user._id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Payment initialized, redirect customer to authorization_url",
      data: resp.data,
    });
  } catch (error) {
    next(error);
  }
};

// verification of payment callback
exports.verificationCallback = async (req, res, next) => {
  const reference = req.query.reference;

  let session;
  let message;

  try {
    //  Verify payment with Paystack
    const verifyResp = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = verifyResp.data.data; // Paystack returns transaction details

    if (data.status !== "success") {
      const error = new Error("payment failed");
      error.status = 400;
      throw error;
    }

    // starting session/ transaction
    const { client } = await mongodbConnect();
    session = client.startSession();
    await session.withTransaction(async () => {
      const parentOrderModel = await parentOrderfn();
      const paymentModel = await paymentfn();
      const orderModel = await orderfn();
      const transactionModel = await transactionfn();

      ////T///////////////////////////////////////////////////////////ODO: move to escrow route
      const parenOrderId = new ObjectId(data.metadata.parent_order_id);

      //// to check if payment is deposite, if yes, update wallet
      if (data.metadata.type === "deposite") {
        //update users wallet

        const walletModel = await walletfn();
        const amount = data.amount / 100;
        await walletModel.updateWallet(
          new ObjectId(data.metadata.userId),
          amount
        );

        //insert new documment to transaction collection

        

        const transData = {
          reference: data.reference,
          type: "deposite",
          userId: new ObjectId(data.metadata.userId),
          amount: data.amount / 100,
          status: data.status,
          channel: data.channel,
          paidAt: new Date(data.paid_at),
          currency: data.currency,
          customerEmail: data.customer.email,
          createdAt: new Date(),
        };

        await transactionModel.createTransaction(transData);
        message = "funds deposite seccessful";
        return;
      }

      // update parent order
      await parentOrderModel.updateParentOrderById(
        parenOrderId,

        {
          "payment.status": "paid_escrow_hold",
          "payment.transaction_ref": data.reference,
          order_status: "awaiting_fulfillment",
        },
        session
      );

      ///update order with same parentorderid/ update child orders
      await orderModel.updateManyByParantOrderId(
        parenOrderId,
        {
          "payment.status": "paid_escrow_hold",
          "payment.transaction_ref": data.reference,
          order_status: "awaiting_fulfillment",
        },
        session
      );

      //  Create payment transaction for direct checkout record
      const checkoutData = {
        reference: data.reference,
        type: "checkout",
        parentOrderId: new ObjectId(data.metadata.parent_order_id),
        buyerId: new ObjectId(data.metadata.buyer_id),
        amount: data.amount / 100,
        status: data.status,
        channel: data.channel,
        paidAt: new Date(data.paid_at),
        currency: data.currency,
        customerEmail: data.customer.email,
        createdAt: new Date(),
      };

      await transactionModel.createTransaction(checkoutData);

      message = "checkout payment successfull"
    });

    res.status(200).json({
      seccess: true,
      message: message,
    });
  } catch (error) {
    next(error);
  } finally {
    if (session) session.endSession();
  }
};

exports.webhooks = async (req, res, next) => {
  // 1. Verify signature
  const signature = req.get("x-paystack-signature");
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  try {
    if (hash !== signature) {
      const error = new Error("Invalid signature");
      error.status = 400;
      throw error;
    }

    //  Process event
    const event = req.body;

    if (event.event !== "charge.success") {
      const error = new Error("payment was not successfull");
      error.status = 402;
      throw error;
    }

    // TODO: update order & create payment record here
    // 3. Reply 200 quickly (very important)

    res.status(200).json({
      success: true,
      message: "payment seccesfull",
    });
  } catch (error) {
    next(error);
  }
};

exports.confirmDelivery = async (req, res, next) => {
  const { vendorOrderId } = req.params;
  const userId = req.user.userId;

  const walletModel = await walletfn()
  let session;
  try {
    const orderModel = await orderfn();
    const vendorModel = await vendorfn();
    const parenOrderModel = await parentOrderfn();

    let vendorNet, vendorGross, vendor, vendorOrder;

    // starting session/ transaction
    const { client } = await mongodbConnect();
    session = client.startSession();

    await session.withTransaction(async () => {
      // checking if vendor order exist
      vendorOrder = await orderModel.findByVendorOrderId(
        new ObjectId(vendorOrderId)
      );

      if (!vendorOrder) {
        const error = new Error("Order not found");
        error.status = 404;
        throw error;
      }

      //Security check: only buyer who placed this order can confirm
      if (vendorOrder.buyer_id.toString() !== userId) {
        const error = new Error("Unauthorize action");
        error.status = 403;
        throw error;
      }

      //calculating vendor and taking 10% from total payout
      vendorGross = vendorOrder.total;
      vendorNet = Math.floor(vendorGross * 0.9); // removing 10%
       vendor = await vendorModel.findByVendorId(vendorOrder.vendor_id);

      if (!vendor) {
        const error = new Error("Vendor not found");
        error.status = 404;
        throw error;
      }

      // update order status to "pending"
      await orderModel.updateVendorOrder(
        vendorOrder._id,
        {
          order_status: "delivered",
          "payment.status": "pending_payout",
        },
        session
      );

      const vendorOrdersForParent = await vendorModel.findVendorOrderByParent(
        vendorOrder.parent_order_id
      );

      // Check if all vendorOrders delivered
      const allDelivered = vendorOrdersForParent.every(
        (vo) => vo.order_status === "delivered"
      );

      /// updating parentorder base on some condition
      if (allDelivered) {
        await parenOrderModel.updateParentOrderById(
          vendorOrder.parent_order_id,
          {
            order_status: "delivered",
            "payment.status": "completed",
          },
          session
        );
      } else {
        await parenOrderModel.updateParentOrderById(
          vendorOrder.parent_order_id,
          {
            order_status: "partially_delivered",
            "payment.status": "partially_released",
          },
          session
        );
      }
    });

    // if (!vendor.recipient_code) {
    //   const error = new Error("vender reciepiant code not set");
    //   error.status = 400;
    //   throw error;
    // }

    //creadit vendors wallet balance
    //update users wallet

    await walletModel.updateWalletPrice( new ObjectId(vendor.userId), vendorGross);

    //  Initiate transfer
    // const transfer = await axios.post(
    //   "https://api.paystack.co//transfer",
    //   {
    //     source: "balance",
    //     amount: vendorNet * 100, // kobo
    //     recipient: vendor.recipient_code,
    //     reason: `Payout for VendorOrder ${vendorOrderId}`,
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    //       "Content-Type": "application/json",
    //     },
    //   }
    // );

    // update: payment + status
    await orderModel.updateVendorOrder(
      vendorOrder._id,
      {
        "payment.status": "released_to_vendor",
        order_status: "completed",
      },
      session
    );

    res.status(200).json({
      success: true,
      message: "Buyer confirmed delivery, payout released to vendor",
      commission_kept: vendorGross - vendorNet,
      transfer: transfer.data,
    });
  } catch (error) {
    next(error);
  } finally {
    if (session) session.endSession();
  }
};
