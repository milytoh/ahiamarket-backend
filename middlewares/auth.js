const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.isAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  
  // Expecting header like: Bearer <token>
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Token missing or malformed");
    err.status = 401;
    throw err;
  }

  const token = authHeader.split(" ")[1];
  const key = process.env.secreat_key;

  try {
    const decoded = jwt.verify(token, key);
    req.user = decoded; // Attach user data to request
    next();
  } catch (err) {
    err.message = "Invalid or expired token";
    err.status = 401;
    next(err);
  }
};


