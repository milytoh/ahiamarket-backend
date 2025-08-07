const { ObjectId } = require("mongodb");

const mongodbConnect = require("../models/db");
const Product = require("../models/product");
const { Vendor } = require("../models/vendor");

async function productfn() {
  const db = await mongodbConnect();
  return new Product(db);
}

async function vendorfn() {
  const db = await mongodbConnect();
  return new Vendor(db);
}

// getting all product from database
exports.allProducts = async (req, res, next) => {
  try {
    const productModel = await productfn();
    const products = await productModel.findAllProducts();
    console.log(products);
    res.status(200).json({
      message: "all products",
      success: true,
      productData: [{ name: "car", price: 300 }],
    });
  } catch (err) {
    next(err);
  }
};

exports.productDetails = async (req, res, next) => {
  const productId = new ObjectId(req.params.id);

  try {
    const productModel = await productfn();

    const product = await productModel.findProductById(productId);

    if (!product) {
      const error = new Error("product not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "product details",
      product,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  const productId = new ObjectId(req.params.id);
  const userId = req.user.userId;
  try {
    //checking if someon is a vendor before deleting a product
    const vendorModel = await vendorfn();
    const vendor = await vendorModel.findVendorByUserId(userId);

    if (!vendor) {
      const error = new Error("operation not allowed, vendor not found");
      error.status = 401;
      throw error;
    }

    const productModel = await productfn();
    const product = await productModel.findProductById(productId);

    if (product.vendorId.toString() !== vendor._id.toString()) {
      const error = new Error("you can only delete your own product");
      error.status = 401;
      throw error;
    }

    const request = await productModel.deleteProductById(productId);

    if (request.countDelete <= 0) {
      const error = new Error("product deletion failed");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "product deleted",
    });
  } catch (err) {
    next(err);
  }
};

exports.getUpdateProduct = async (req, res, next) => {
  const productId = new ObjectId(req.params.id);
  const userId = req.user.userId;
  try {
    //checking if someon is a vendor before deleting a product
    const vendorModel = await vendorfn();
    const vendor = await vendorModel.findVendorByUserId(userId);

    if (!vendor) {
      const error = new Error("operation not allowed, vendor not found");
      error.status = 401;
      throw error;
    }

    const productModel = await productfn();
    const product = await productModel.findProductById(productId);

    if (product.vendorId.toString() !== vendor._id.toString()) {
      const error = new Error("you can only edit your own product");
      error.status = 401;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "edit product",
      product,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  const userId = req.user.userId;
  const productId = new ObjectId(req.params.id);
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
      const error = new Error("this user is not a vendor, apply for a vendor ");

      error.status = 404;
      throw error;
    }
    const product = await productModel.findProductById(productId);
    if (product.vendorId.toString() !== vendor._id.toString()) {
      const error = new Error("you can't update this product");
      error.status = 401;
      throw error;
    }

    const updateProductData = {
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

    await productModel.updateProduct(productId, vendor._id, updateProductData);

    res.status(201).json({
      success: true,
      message: "product updated successful",
    });
  } catch (error) {
    next(error);
  }
};
