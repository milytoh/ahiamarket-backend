exports.allProducts = (req, res, next) => {
    console.log('lll')
  res.status(200).json({
    message: "all products",
    success: true,
    productData: [{ name: "car", price: 300 }],
  });
};
