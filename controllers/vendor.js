const mongodbConnect = require("../models/db");
const { ObjectId } = require("mongodb");

const { validationResult } = require("express-validator");

const { VendorApplication, Vendor } = require("../models/vendor");
const Product = require("../models/product");

const Wallet = require("../models/wallet");
const { Orders, ParentOrders } = require("../models/order");

async function vendorApplication() {
  const { db } = await mongodbConnect();
  return new VendorApplication(db);
}

async function vendorfn() {
  const { db } = await mongodbConnect();
  return new Vendor(db);
}

async function productfn() {
  const { db } = await mongodbConnect();
  return new Product(db);
}

async function walletfn() {
  const { db } = await mongodbConnect();
  return new Wallet(db);
}

async function orderfn() {
  const { db } = await mongodbConnect();
  return new Orders(db);
}

// vendor application
exports.vendorApplication = async (req, res, next) => {
  const userId = req.user.userId;
  const storeName = req.body.storeNameIdentity;
  const bio = req.body.storeBioIdentity;
  const address = req.body.address;
  const state = req.body.state;
  const city = req.body.city;
  const category = req.body.category;

  console.log(req.body);

  try {
    const result = validationResult(req);

    //checking if any field is invalid
    if (!result.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid inputs",
        error: result.array().map((err) => ({
          field: err.path,
          errMessage: err.msg,
        })),
      });
    }

    const vendorModel = await vendorfn();
    const vendorApplicationModel = await vendorApplication();

    const vendorAppli = await vendorApplicationModel.findVendorByUserId(userId);
    const aVendor = await vendorModel.findVendorByUserId(userId);

    // checking if applicant already a vendor
    if (aVendor) {
      const error = new Error("You are already a Vendor!!, Have great sells ");
      error.isOperational = true;
      error.status = 409;
      throw error;
    }

    // checking if applicant have already applied for a vendor
    if (vendorAppli) {
      const error = new Error(
        "this user have already applied for a vendor, wait for confirmation and approval",
      );
      error.isOperational = true;
      error.status = 409;
      throw error;
    }

    const vendorData = {
      userId: userId,
      store_name: storeName,
      category: category,
      bio: bio,
      logo_url: null,
      address: address,
      followers: null,
      location: {
        city: city,
        state: state,
        country: "Nigeria",
        // coordinates: { lat: 6.5244, lng: 3.3792 },
      },
      stats: {
        total_sales: null,
        total_orders: null,
        rating: null,
      },
      verification: {
        nin: null,
        bvn: null,
        documents: [{ type: null, url: null }],
        status: "pending",
        verified_by: null, // admin id
        verified_at: null,
      },

      created_at: Date.now(),
      updated_at: Date.now(),
    };

    await vendorApplicationModel.applyVendor(vendorData);

    res.status(201).json({
      success: true,
      message: "vendor request submited",
    });
  } catch (error) {
    next(error);
  }
};

// vendor creating a product
exports.createProduct = async (req, res, next) => {
  const result = validationResult(req);
  const userId = req.user.userId;

  console.log("jjjjjjjj");
  const { name, description, price, condition, category, stock, tags } =
    req.body;

  const formattedPrice = parseFloat(parseFloat(price).toFixed(2));

  const formattedstock = parseInt(stock);

  console.log(req.body);

  //checking if any field is invalid
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Invalid inputs",
      error: result.array().map((err) => ({ 
        field: err.path,
        errMessage: err.msg,
      })),
    });
  }

  try {
    const vendorModel = await vendorfn();
    const productModel = await productfn();

    // to check if a users is a vendor before creating a product
    const vendor = await vendorModel.findVendorByUserId(userId);
    if (!vendor) {
      const error = new Error(
        "this user is not a vendor, apply for a vendor to start selling products",
      );
      isOperational = true;
      error.status = 404;
      throw error;
    }

    const productData = {
      vendorId: vendor._id,
      name: name,
      description: description,
      price: formattedPrice,
      currency: "NGN",
      category: category,
      condition: condition,
      images: null, //[String], // URLs
      stock: formattedstock,
      status: "active",
      tags: tags,
      rating: {
        average: null,
        count: null,
      },
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const product = await productModel.createProduct(productData);

    res.status(201).json({
      success: true,
      message: "product created successful",
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardOverview = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const vendorModel = await vendorfn();
    const walletModel = await walletfn();
    const orderModel = await orderfn();

    // Correct method calls based on your class methods
    const [dashboardData, vendorProfile, wallet] = await Promise.all([
      vendorModel.getVendorDashboardOverview(userId),
      vendorModel.findByVendorId(userId),
      walletModel.findWalletByOwnerId(userId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        vendor: vendorProfile || {},
        wallet: {
          balance: wallet?.balance || 0,
          currency: wallet?.currency || "NGN",
        },
        stats: {
          totalOrders: dashboardData.totalOrders || 0,
          totalSales: dashboardData.totalSales || 0,
          avgOrderValue: dashboardData.avgOrderValue || 0,
          todayOrders: dashboardData.todayOrders || 0,
          pendingOrders: dashboardData.pendingOrders || 0,
          pendingSettlementAmount: dashboardData.pendingSettlementAmount || 0,
        },
        sevenDaySales: dashboardData.sevenDaySales || [],
        recentOrders: dashboardData.recentOrders || [],
        topProducts: dashboardData.topProducts || [],
        podStats: dashboardData.podStats || [],
      },
    });
  } catch (error) {
    console.error("Dashboard Overview Error:", error);
    next(error);
  }
};
