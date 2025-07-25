require("dotenv").config();
const nodemailer = require("nodemailer");

const sendPwdResetEmail = async (email, userId, token) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetURL = `https://localhost:3000/account/request-password-reset?id=${userId}&token=${token}`;

  const mailOptions = {
    from: `"AhiaMarket" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      ${resetURL}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendPwdResetEmail;



//https://locallhost:3000/account/request-password-reset?id=68839bf4acf5c18e066b16a1&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgzOWJmNGFjZjVjMThlMDY2YjE2YTEiLCJlbWFpbCI6Im1pbHl0b2hnb2xkQGdtYWlsLmNvbSIsImlhdCI6MTc1MzQ1NTc5OCwiZXhwIjoxNzUzNDU2OTk4fQ.aXuzgUp4t6hHfyNE4LaxvVWRJP145W6cq7QY--_LP_k
