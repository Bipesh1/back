import { NextFunction, Request, Response } from "express";
import generateToken from "../config/jwToken";
import { body, validationResult } from "express-validator";
import Admin from "../models/adminModel";
import uniqid from "uniqid";
import asyncHandler from "express-async-handler";
import generateRefreshedToken from "../config/refreshToken";
import { validateMongodbId } from "../utils/validateMongoId";
import sendEmail from "../utils/sendEmail";
import crypto from "crypto";
import jwt from "jsonwebtoken";

//create admin
export const createAdmin = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .custom((value) => {
      const invalidEmailPattern = /^\d+\.?\d*@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
      if (invalidEmailPattern.test(value)) {
        throw new Error(
          "Email cannot be in the format of numbers followed by a dot."
        );
      }
      return true;
    }),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { adminName, email, mobile, password, role } = req.body;

      const newAdmin = new Admin({
        adminName,
        email,
        mobile,
        password,
        role: "admin",
        counselor: null,
      });

      await newAdmin.save();
      res
        .status(201)
        .json({ message: "Admin created successfully", admin: newAdmin });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

//login
export const loginAdminCtrl = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Check if admin exists
    const findAdmin = await Admin.findOne({ email });
    if (!findAdmin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }

    if (findAdmin.role !== "admin") {
      res.status(403).json({ message: "Not admin! Unauthorized admin!" });
      return;
    }

    if (await findAdmin.isPasswordMatched(password)) {
      const refreshToken = await generateRefreshedToken(findAdmin._id);
      await Admin.findByIdAndUpdate(
        findAdmin._id,
        { refreshToken },
        { new: true }
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000, // 72 hours
      });

      res.json({
        _id: findAdmin._id,
        adminName: findAdmin.adminName,
        email: findAdmin.email,
        role: findAdmin.role,
        token: generateToken(findAdmin._id),
        refreshToken,
      });
    } else {
      res.status(401).json({ message: "Invalid Credentials!" });
    }
  }
);

//Logout
export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // extract the refreshToken from the cookie header
    const cookie = req.headers.cookie;
    let refreshToken = null;

    if (cookie) {
      // sSplit
      const cookies = cookie.split(";");
      for (const c of cookies) {
        const [key, value] = c.trim().split("=");
        if (key === "refreshToken") {
          refreshToken = value;
          break;
        }
      }
    }

    if (!refreshToken) {
      throw new Error("Authorization token is missing!");
    }

    const admin = await Admin.findOne({ refreshToken });

    if (!admin) {
      res.removeHeader("refreshToken");
      res.sendStatus(204);
      return;
    }

    await Admin.findOneAndUpdate({ refreshToken }, { refreshToken: "" });

    res.removeHeader("refreshToken");

    res.sendStatus(200);
  }
);

//Update a admin
export const updateAdmin = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email format")
    .custom((value) => {
      const invalidEmailPattern = /^\d+\.?\d*@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
      if (invalidEmailPattern.test(value)) {
        throw new Error(
          "Email cannot be in the format of numbers followed by a dot."
        );
      }
      return true;
    }),
  body("mobile")
    .matches(/^98\d{8}$/)
    .withMessage("Mobile number must be valid"),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),

  asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { id } = req.params;

      // Validate the ID
      validateMongodbId(id);

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      try {
        // Fetch the admin based on ID
        const admin = await Admin.findById(id);
        if (!admin) {
          res.status(404).json({ success: false, message: "Admin not found" });
          return;
        }

        // Update admin details if provided
        admin.adminName = req.body.adminName || admin.adminName;
        admin.email = req.body.email || admin.email;
        admin.mobile = req.body.mobile || admin.mobile;
        admin.password = req.body.password || admin.password;

        // Save the updated admin
        const updatedAdmin = await admin.save();

        res.status(200).json({
          success: true,
          message: "Admin updated successfully",
          admin: updatedAdmin,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error updating admin",
          error: error.message,
        });
      }
    }
  ),
];

//get all admins
export const getallAdmins = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const admins = await Admin.find();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//get a single admin
export const getAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const admin = await Admin.findById(id).select(
      "email adminName mobile role password"
    );
    res.json(admin);
  } catch (e) {
    throw new Error(e);
  }
});

//delete a single admin
export const deleteAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const deleteAdmin = await Admin.findByIdAndDelete(id);
    res.json(deleteAdmin);
  } catch (e) {
    throw new Error(e);
  }
});

// Update password with validation
export const updatePassword = async (req, res) => {
  const { _id } = req.admin;
  const { password } = req.body;
  validateMongodbId(_id);

  // Validate password
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  if (
    password.length < 6 ||
    !/[A-Z]/.test(password) ||
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    return res.status(400).json({
      message:
        "Password must be at least 6 characters long, contain at least one uppercase letter, and at least one special character",
    });
  }

  try {
    const admin = await Admin.findById(_id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (password) {
      admin.password = password;
      const updatedAdmin = await admin.save();
      res.json({
        message: "Password updated successfully",
        admin: updatedAdmin,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
