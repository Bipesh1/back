import multer from "multer";
import cloudinary from "cloudinary";
import { Request } from "express";
import dotenv from "dotenv";
dotenv.config();

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const storage = multer.memoryStorage(); // Stores file in memory (as a Buffer)

// File filter to allow only specific formats
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype)) {
    cb(null, true); // Accept the file, passing `null` as the error argument
  } else {
    cb(new Error("Only JPG, PNG, and JPEG formats are allowed") as any, false);
  }
};

const upload = multer({
  storage: storage, // Define your storage configuration
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB file size limit
  },
});

export default upload;
