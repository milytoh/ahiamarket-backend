const mongodbConnect = require("../models/db");

const { VendorApplication, Vendor } = require("../models/vendor");
const Product = require("../models/product");

async function vendorApplication() {
  const db = await mongodbConnect();
  return new VendorApplication(db);
}

async function vendorfn() {
  const db = await mongodbConnect();
  return new Vendor(db);
}

async function productfn() {
  const db = await mongodbConnect();
  return new Product(db);
}

// vendor application
exports.vendorApplication = async (req, res, next) => {
  const userId = req.user.userId;
  const storeName = req.body.storename;
  const bio = req.body.bio;
  const address = req.body.address;
  const state = req.body.state;
  const city = req.body.country;

  try {
    const vendorModel = await vendorfn();
    const vendorApplicationModel = await vendorApplication();

    const vendoruser = await vendorApplicationModel.findVendorByUserId(userId);

    // checking if applicant have already applied for a vendor
    if (vendoruser) {
      const error = new Error(
        "this user have already applied for a vendor, wait for confirmation"
      );
      error.status = 409;
      throw error;
    }

    //checking if a already vendor want to apply again
    const vendor = await vendorModel.findVendorByUserId(userId);
    if (vendor) {
      const error = new Error("users is already a vendor");
      error.status = 409;
      throw error;
    }

    const vendorData = {
      userId: userId,
      store_name: storeName,
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
  const userId = req.user.userId;
  const { name, description, price, condition, category, stock, tags } =
    req.body;

  const formattedPrice = parseFloat(parseFloat(price).toFixed(2));
 
  const formattedstock = parseInt(stock); 

  try {
    const vendorModel = await vendorfn();
    const productModel = await productfn();

    // to check if a users is a vendor before creating a product
    const vendor = await vendorModel.findVendorByUserId(userId);
    if (!vendor) {
      const error = new Error(
        "this user is not a vendor, apply for a vendor to start selling products"
      );

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
