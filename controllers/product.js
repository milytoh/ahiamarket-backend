const mongodbConnect = require("../models/db");
const Product = require("../models/product");
const { Vendor } = require("../models/vendor");

const { ObjectId } = require("mongodb");

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
 
    console.log(product);

    const request = await productModel.deleteProductById(productId);

    if (request.countDelete <= 0) {
      const error = new Error("product deletion failed");
      error.status = 404;
      throw error;
    }   
    
    res.status(200).json({
      success: true,
      message: "product deleted"
    })
  } catch (err) {
    next(err)
  }
};
