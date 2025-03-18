const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "golupatel23723@gmail.com",
    pass: "pavwamkxuomzdqeu",
  },
});

module.exports = transporter;
