import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const inquiryEmail = async (
  send_from: string,
  subject: string,
  name: string,
  phone: string,
  message: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.INQUIRY_EMAIL_USER,
        pass: process.env.INQUIRY_EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const emailBody = `
    <h2>Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;
    const options = {
      from: `"${name}" <${process.env.INQUIRY_EMAIL_USER}>`,
      to: process.env.INQUIRY_EMAIL_USER,
      subject: subject,
      html: emailBody,
      replyTo: send_from,
    };

    const info = await transporter.sendMail(options);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default inquiryEmail;
