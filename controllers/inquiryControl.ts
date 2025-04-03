import { Request, Response } from "express";
import inquiryEmail from "../utils/inquiryEmail";

export const sendInquiry = async (req: Request, res: Response) => {
  const { email, text, number, fullname } = req.body;

  try {
    const send_from = email;
    const subject = "Contact Form Submission";
    const name = fullname;
    const phone = number;
    const message = text;

    if (!send_from) {
      return res.status(500).json({ error: "No sender email provided!" });
    }

    await inquiryEmail(send_from, subject, name, phone, message);
    res.status(200).json({ success: true, message: "Email Sent" });
  } catch (error) {
    console.error("Email Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
