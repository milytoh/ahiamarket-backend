require("dotenv").config();
const nodemailer = require("nodemailer");

const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    
    from: `"AhiaMarket" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "OTP Verification Code",
    html: `<p>Your OTP code is: <b>${otp}</b></p><p> please verify your Email to contnue, code expires in 5 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendOtpEmail;
