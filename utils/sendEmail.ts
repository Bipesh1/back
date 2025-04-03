import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async (
  subject: string,
  send_to: string,
  emailBody: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: Number(process.env.EMAIL_PORT) || 587, // or use 465 for secure SMTP
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Prevents certificate errors
      },
    });

    const options = {
      from: `College Abroad <${process.env.EMAIL_USER}>`,
      to: send_to,
      subject,
      html: emailBody,
      replyTo: process.env.EMAIL_USER,
      attachments: [
        {
          filename: "khalti_qr_gca.jpeg",
          path: __dirname + `/QR_images/khalti_qr_gca.jpg`,
          cid: "khalti",
        },
        {
          filename: "esewa_qr_gca.jpeg",
          path: __dirname + `/QR_images/esewa_qr_gca.jpg`,
          cid: "esewa",
        },
        {
          filename: "bank_qr_gca.jpeg",
          path: __dirname + `/QR_images/bank_qr_gca.jpeg`,
          cid: "bank",
        },
      ],
    };

    const info = await transporter.sendMail(options);
    console.log("Email sent successfully:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default sendEmail;
