const { ObjectId } = require("mongodb");

const mongodbConnect = require("../../models/db");
const { validationResult } = require("express-validator");

const Product = require("../../models/product");
const Admin = require("../../models/admin/admin");

async function productfn() {
  const { db } = await mongodbConnect();
  return new Product(db);
}

async function adminfn() {
  const { db } = await mongodbConnect();
  return new Admin(db);
}

exports.adminDeleteProduct = async (req, res, next) => {
  const adminId = new ObjectId(req.admin.adminId);
  const produtId = new ObjectId(req.body.productId);

  try {
    const productModel = await productfn();
    const adminModel = await adminfn();

    const product = await productModel.findProductById(produtId);
    if (!product) {
      const error = new Error("no product found");
      error.status = 404;
      throw error;
    }

    // fetch admin
    const admin = await adminModel.findAdminById(adminId);
    if (!admin) {
      const error = new Error("no admin found");
      error.status = 404;
      throw error;
    }

    /// checking admins permission to delete product
    if (admin?.role !== "superAdmin" && admin?.role !== "contentAdmin") {
      const error = new Error("unauthorize");
      error.status = 403;

      throw error;
    }

    await productModel.deleteProductById(product._id);

    res.status(200).json({
      success: true,
      message: "product deleted",
    });
  } catch (error) {
    next(error);
  }
};

exports.getEditProduct = async (req, res, next) => {
  const productId = new ObjectId(req.params.id);
  const adminid = new ObjectId(req.admin.adminId);

  try {
    const productModel = await productfn();
    const adminModel = await adminfn();

    const admin = await adminModel.findAdminById(adminid);

    /// checking admins permission to delete product
    if (admin?.role !== "superAdmin" && admin?.role !== "contentAdmin") {
      const error = new Error("unauthorize");
      error.status = 403;

      throw error;
    }

    const product = await productModel.findProductById(productId);
    if (!product) {
      const error = new Error(" no product found");
      error.status = 404;
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

exports.editProduct = async (req, res, next) => {
  const result = validationResult(req);
  const adminId = new ObjectId(req.admin.adminId);
  const productId = new ObjectId(req.params.id);
  const { name, description, price, condition, category, stock, tags } =
    req.body;
  const formattedPrice = parseFloat(parseFloat(price).toFixed(2));
  const formattedstock = parseInt(stock);

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
    const productModel = await productfn();

    const adminModel = await adminfn();

    const admin = await adminModel.findAdminById(adminId);

    /// checking admins permission to delete product
    if (admin?.role !== "superAdmin" && admin?.role !== "contentAdmin") {
      const error = new Error("unauthorize");
      error.status = 403;

      throw error;
    }

    const product = await productModel.findProductById(productId);
    if (!product) {
      const error = new Error("product not found");
      error.status = 404;
      throw error;
    }

    const updateProductData = {
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
      updated_at: Date.now(),
    };

    await productModel.updateProduct(
      productId,
      product.vendorId,
      updateProductData
    );

    res.status(201).json({
      success: true,
      message: "product updated successful",
    });
  } catch (error) {
    next(error);
  }
};
