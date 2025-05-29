require("dotenv").config();
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Add Gmail address
    pass: process.env.EMAIL_PASSWORD, // Add Gmail App Password
    //user: process.env.EMAIL_USER, // Add Gmail address
    //pass: process.env.EMAIL_PASSWORD, // Add Gmail App Password
  },
});

async function sendRegistrationEmail(to, name) {
  const mailOptions = {
    from: `"Global Study Share" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Welcome to Global Study Share",
    html: `
      <h3>Hi ${name},</h3>
      <p>Thank you for registering on our platform!</p>
      <p>We're excited to have you with us.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendAnswerNotificationEmail(
  questionAuthorEmail,
  questionAuthorName,
  questionTitle,
  answerBody,
  questionId
) {
  const mailOptions = {
    from: `"Global Study Share" <${process.env.EMAIL_USER}>`,
    to: questionAuthorEmail,
    subject: `Your question "${questionTitle}" has a new answer!`,
    html: `
      <h3>Hi ${questionAuthorName},</h3>
      <p>Good news! Your question **"${questionTitle}"** has just received a new answer.</p>
      <p>Here's a snippet of the answer:</p>
      <blockquote style="background-color: #f0f0f0; padding: 10px; border-left: 5px solid #007bff;">
        <p>${answerBody.substring(0, 200)}${
      answerBody.length > 200 ? "..." : ""
    }</p>
      </blockquote>
      <p>Click <a href="${
        process.env.FRONTEND_URL
      }/templates/user/question-details.html?id=${questionId}">here</a> to view the full answer and comments.</p>
      <p>Thanks for being a part of Global Study Share!</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  sendRegistrationEmail,
  sendAnswerNotificationEmail, //
};
