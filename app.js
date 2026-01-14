const path = require("path");

const express = require("express");
const passport = require("passport");
require("dotenv").config();

const app = express();
require("./utils/passport");

// routes inport
const authRoute = require("./routes/auth");
const productsRoute = require("./routes/products");
const vendorRoute = require("./routes/vendors");
const orderRoute = require("./routes/order");
const cartRoute = require("./routes/cart");
const paymentRoute = require("./routes/transaction");
const walletRoute = require("./routes/wallet");
const followerRoute = require("./routes/follower")
const adminAuthRoute = require("./routes/admin/auth");
const adminAdministrationRoute = require("./routes/admin/administration");
const adminProduct = require("./routes/admin/product");

app.use(express.json());

//enables your Express server to accept cross-origin requests from the frontend
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Important for preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});


// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "OPTIONS, GET, POST, PUT, PATCH, DELETE"
//   );
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   next();
// });

app.use(passport.initialize());

app.use("/api/account", authRoute);
app.use("/api", productsRoute);
app.use("/api", vendorRoute);
app.use("/api", orderRoute);
app.use("/api", cartRoute);
app.use("/api", paymentRoute);
app.use("/api", walletRoute);
app.use("/api", followerRoute)
app.use("/api/admin", adminAuthRoute);
app.use("/api/admin", adminAdministrationRoute);
app.use("/api/admin", adminProduct)

//error meddleware
// app.use((error, req, res, nex) => {
//   console.log(error, "1er");
//   const statusCode = error.status || 500;
//   let message = error.message || "something went wrong";

//  return res.status(statusCode).json({
//     success: false,
//     status: statusCode,
//     message: message,
//   });
// });

app.use((error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = "Something went wrong!";
  let errors = null;

  if (error.isOperational) {
    message = error.message;
  }

  if (error.array && typeof error.array === "function") {
    statusCode = 400;
    message = "Invalid inputs";
    errors = error.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));
  }

  
  if (error.code === 11000) {
    statusCode = 409;
    message = "Email already exists";
  }

  
  console.error(" SERVER ERROR:", error);
  
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
});


const PORT = 3000;

app.listen(PORT, (err) => {
  if (err) {
    console.log(err); 
  }
  console.log(`server is runing at port ${PORT}`);
});

// 