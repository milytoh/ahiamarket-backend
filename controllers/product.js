
exports.createProduct = (req, res, next) => {
  
}


exports.allProducts = (req, res, next) => {
    
  res.status(200).json({
    message: "all products",
    success: true,
    productData: [{ name: "car", price: 300 }],
  });
};
