const { ObjectId } = require("mongodb");

const mongodbConnect = require("../../models/db");

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
          message: "product deleted"
      })
  } catch (error) {
    next(error);
  }
};

exports.getEditProduct = async (req, res, next) => {
    const productId = new ObjectId(req.body.produtId);
    const adminid =  new ObjectId(req.admin.adminId)

    try {
      const productModel = await productfn();

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
            product
        })
    } catch (error) {
        next(error)
    }
}


