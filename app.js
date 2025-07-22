const path = require("path");

const express = require("express");

require('dotenv').config();
const cors = require('cors')
const app = express();
const passport = require('passport')


const authRoute = require("./routes/auth");
const productsRoute = require("./routes/products");

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

app.use(passport.initialize())

app.use("/account", authRoute);
app.use(productsRoute);

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
