const mongodbConnect = require("../models/db");
const Cart = require("../models/cart");
const Product = require("../models/product");

async function carttfn() {
  const db = await mongodbConnect();
  return new Cart(db);
}

async function producttfn() {
  const db = await mongodbConnect();
  return new Product(db);
}

exports.addToCart = async (req, res, next) => {
  const userId = req.user.userId;
  const { productId, vendorId, quantity, priceSnapsot } = req.body;

  const cartModel = await carttfn();
  const productModel = await producttfn();

  // checking for a product and getting it latest price
  const product = await productModel.deleteProductById(productId);

  if (!product) {
    const error = new Error("product not found");
    error.status = 404;
    throw error;
  }

  const cart = await cartModel.findCartByUserId(userId);

  if (!cart) {
    cartData = {
      userId,
      items: [
        {
          productId,
          vendorId,
          quantity: quantity,
          priceSnapshot: priceSnapsot, // price at time of adding to cart
          addedAt: Date.now(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await cartModel.insertCart(cartData);
  } else {
    const existingItemIndex = cart.items.findIndex((item) => {
      return item.productId.toString() === productId;
    });

    if (existingItemIndex >= 0) {
      const itemKey = `items.${existingItemIndex}.quantity`;
      await cartModel.updateCartByUserId(userId, itemKey, quantity);
    } else {
    }
  }

  // carts
};
