const mongodbConnect = require("../models/db");
const Product = require("../models/product");

const { ObjectId } = require("mongodb");

async function productfn() {
  const db = await mongodbConnect();
  return new Product(db);
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

exports.deleteProduct = async(req, res, next) =>{
  const productId = new ObjectId(req.params.id);
  try {
    const productModel = await productfn();
    const request = await productModel.deleteProductById(productId);

    if (request.countDelete <= 0) {
      const error = new Error("delete seccessful")
    }
    
  } catch (err) {
    
  }
}
