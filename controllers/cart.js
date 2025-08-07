const { ObjectId } = require("mongodb");

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
  const userId = new ObjectId(req.user.userId);
  const { productId, vendorId, quantity } = req.body;

  try {
    const cartModel = await carttfn();
    const productModel = await producttfn();

    // checking for a product and getting it latest price
    const prodId = new ObjectId(productId);
    const product = await productModel.findProductById(prodId);

    if (!product) {
      const error = new Error("product not found");
      error.status = 404;
      throw error;
    }

    const cart = await cartModel.findCartByUserId(userId);
    const priceAtTime = product.price;

    // checkin if no cart exist for a user, create new cart
    if (!cart) {
      cartData = {
        userId,
        items: [
          {
            productId,
            vendorId,
            quantity: quantity,
            priceAtTime, // price at time of adding to cart
            addedAt: Date.now(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await cartModel.insertCart(cartData);
    } else {
      // if a user has a cart item already, and alse if the product already in items array, get the index
      const existingItemIndex = cart.items.findIndex((item) => {
        return item.productId.toString() === productId;
      });

      if (existingItemIndex >= 0) {
        const itemKey = `items.${existingItemIndex}.quantity`;
        await cartModel.updateCartQuantity(userId, itemKey, quantity);
      } else {
        // Product not in cart → push new item
        const item = {
          productId,
          vendorId,
          quantity: quantity,
          priceAtTime, // price at time of adding to cart
          addedAt: Date.now(),
        };
        await cartModel.pushToCart(userId, item);
      }
    }

    const displayCart = await cartModel.findCartByUserId(userId);
    res.status(201).json({
      success: true,
      message: "product added to cart successful",
      cartItem: displayCart,
    });
  } catch (error) {
    next(error);
  }
};

// to get all cart
exports.getCart = async (req, res, next) => {
  const userId = new ObjectId(req.user.userId);

  try {
    const cartModel = await carttfn();
    const cartItems = await cartModel.findCartByUserId(userId);

    if (!cartItems) {
      const error = new Error("no cart found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "cart items",
      cart: cartItems,
    });
  } catch (error) {
    next(error);
  }
};

//	Update quantity
exports.updateCartItem = async (req, res, next) => {
  // cart item id
  const itemId = req.params.itemId;
  const flag = req.body.flag;

  const userId = new ObjectId(req.user.userId);

  try {
    const cartModel = await carttfn();
    const cart = await cartModel.findCartByUserId(userId);
    //checking if login user have cart already
    if (!cart) {
      const error = new Error("no cart found");
      error.status = 404;
      throw error;
    }
    //finding the index of the cart to update
    const existingItemIndex = cart.items.findIndex((item) => {
      return item.productId.toString() === itemId;
    });

    //to increment the quantity
    if (existingItemIndex >= 0 && flag === "increment") {
      const itemKey = `items.${existingItemIndex}.quantity`;

      await cartModel.updateCartQuantity(userId, itemKey, 1);
    }

    // to decrement the quantity
    if (existingItemIndex >= 0 && flag === "decrement") {
      const itemKey = `items.${existingItemIndex}.quantity`;

      await cartModel.updateCartQuantity(userId, itemKey, -1);
    }

    res.status(201).json({
      success: true,
      message: "cart item updated",
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCartItem = async (req, res, next) => {
  const itemId = req.params.itemId;

  const userId = new ObjectId(req.user.userId);

  try {
    const cartModel = await carttfn();
    const cart = await cartModel.findCartByUserId(userId);
    //checking if login user have cart already
    if (!cart) {
      const error = new Error("no cart found");
      error.status = 404;
      throw error;
    }

    const cartItems = cart.items.filter(
      (item) => item.productId.toString() !== itemId
    );

    await cartModel.deleteCartItem(userId, cartItems);

    res.status(200).json({
      success: true,
      message: "cart item deleted"
    })
  } catch (error) {
    next(error);
  }
};
