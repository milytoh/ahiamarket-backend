const { ObjectId } = require("mongodb");

const mongodbConnect = require("../models/db");
const Product = require("../models/product");
const { Vendor } = require("../models/vendor");
const { validationResult } = require("express-validator");

async function productfn() {
  const { db } = await mongodbConnect();
  return new Product(db);
}

async function vendorfn() {
  const { db } = await mongodbConnect();
  return new Vendor(db);
}

const fs = require("fs");
const path = require("path");

exports.getOneProduct = async (req, res, next) => {
  const userId = req.user.userId;
  const productId = new ObjectId(req.params.id);

  try {
    const productModel = await productfn();
    const product = await productModel.findProductById(productId, userId);
    if (!product) {
      const error = new Error("product not found");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }
    res.status(200).json({
      success: true,
      message: "product found",
      product,
    });
  } catch (err) {
    next(err);
  }
};

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

exports.vendorProducts = async (req, res, next) => {
  const userId = req.user.userId;
  const vendorModel = await vendorfn();
  const productModel = await productfn();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const category = req.query.category;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  const skip = (page - 1) * limit;

  try {
    // to check if a users is a vendor
    const vendor = await vendorModel.findVendorByUserId(userId);

    if (!vendor) {
      const error = new Error(
        "this user is not a vendor, apply for a vendor to start selling products",
      );
      isOperational = true;
      error.status = 404;
      throw error;
    }

    const { products, totalProducts } =
      await productModel.findProductsByVendorId(vendor.userId, skip, limit, {
        status,
        category,
        startDate,
        endDate,
      });

    res.status(200).json({
      success: true,
      message: "vendor products",
      products,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      total: totalProducts,
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
      error.isOperational = true;
      throw error;
    }

    const productModel = await productfn();
    const product = await productModel.findProductById(productId);

    if (product.vendorId !== vendor.userId) {
      const error = new Error("you can only delete your own product");
      error.status = 401;
      error.isOperational = true;
      throw error;
    }

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        const imageStillUsed = await productModel.findImgBeforeDelete(
          productId._id,
          image,
        );

        // if no product uses it again
        if (!imageStillUsed) {
          const imagePath = path.join(__dirname, "../uploads/products", image);

          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      }
    }

    const request = await productModel.deleteProductById(productId, userId);

    if (request.countDelete <= 0) {
      const error = new Error("product deletion failed");
      error.status = 404;
      error.isOperational = true;
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
    const product = await productModel.findProductById(productId, userId);

    if (!product) {
      const err = new Error("Product not found");
      err.status = 404;
      err.isOperetional = true;
      throw err;
    }

    if (product.vendorId.toString() !== vendor.userId.toString()) {
      const error = new Error("you can only edit your own product");
      error.status = 401;
      error.isOperational = true;
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
  const result = validationResult(req);
  const userId = req.user.userId;
  const productId = new ObjectId(req.params.id);

  const {
    productName: name,
    description,
    unitPrice,
    condition,
    category,
    stock,
    tags,
    podEnabled: pod,
    existingImages,
    status,
  } = req.body;

  const formattedPrice = parseFloat(parseFloat(unitPrice).toFixed(2));

  const formattedstock = parseInt(stock);

  const newImages = req.files?.map((file) => file.filename) || [];

  let finalImages = [];

  if (existingImages) {
    finalImages = JSON.parse(existingImages);
  }

  finalImages = [...finalImages, ...newImages];

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
      const error = new Error("this user is not a vendor, apply for a vendor ");
      error.isOperational = true;
      error.status = 404;
      throw error;
    }
    const product = await productModel.findProductById(productId);
    if (product.vendorId.toString() !== userId.toString()) {
      const error = new Error("you can't update this product");
      error.isOperational = true;
      error.status = 401;
      throw error;
    }

    const updateProductData = {
      vendorId: userId,
      name: name,
      description: description,
      price: formattedPrice,
      category: category,
      condition: condition,
      images: finalImages,
      stock: formattedstock,
      tags: tags,
      pod: pod,
      status: status,
      updated_at: Date.now(),
    };

    await productModel.updateProduct(
      productId,
      vendor.userId,
      updateProductData,
    );

    const oldImagesFromDB = product.images;

    const removedImages = oldImagesFromDB.filter(
      (img) => !existingImages.includes(img),
    );

    // delete from disk
    removedImages.forEach((img) => {
      fs.unlinkSync(`uploads/products/${img}`);
    });

    res.status(201).json({
      success: true,
      message: "product updated successful",
    });
  } catch (error) {
    next(error);
  }
};

exports.cloneProduct = async (req, res, next) => {
  const userId = req.user.userId;
  const productId = new ObjectId(req.body.productId);

  try {
    const vendorModel = await vendorfn();
    const productModel = await productfn();
    // to check if a users is a vendor before creating a product
    const vendor = await vendorModel.findVendorByUserId(userId);

    if (!vendor) {
      const error = new Error("this user is not a vendor, apply for a vendor ");
      error.isOperational = true;
      error.status = 404;
      throw error;
    }

    const product = await productModel.findProductById(productId);

    if (!product) {
      const error = new Error("product not found");
      error.status = 404;
      throw error;
    }

    if (product.vendorId.toString() !== userId.toString()) {
      const error = new Error("you can't clone this product");
      error.isOperational = true;
      error.status = 401;
      throw error;
    }

    const clonedProductData = {
      vendorId: userId,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: "NGN",
      category: product.category,
      condition: product.condition,
      images: product.images,
      stock: product.stock,
      status: "draft",
      tags: product.tags,
      pod: product.pod,
      rating: {
        average: product.rating.average,
        count: product.rating.count,
      },
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    await productModel.createProduct(clonedProductData);

    res.status(201).json({
      success: true,
      message: "product cloned successfully",
    });
  } catch (error) {
    next(error);
  }
};
