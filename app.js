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
const adminRoute = require("./routes/admin");
const orderRoute = require("./routes/order");
const cartRoute = require("./routes/cart");

app.use(express.json());

//enables your Express server to accept cross-origin requests from the frontend
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(passport.initialize());

app.use("/api/account", authRoute);
app.use("/api", productsRoute);
app.use("/api", vendorRoute);
app.use("/api/admin", adminRoute);
app.use("/api", orderRoute);
app.use("/api", cartRoute);

//error meddleware
app.use((error, req, res, nex) => {
  console.log(error);
  const statusCode = error.status || 500;
  const message = error.message || "something went wrong";

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
  });
});

const PORT = 3000;

app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`server is runing at port ${PORT}`);
});

// "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath "C:\data\db" --replSet rs0