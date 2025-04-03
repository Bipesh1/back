import { NextFunction, Request, Response } from "express";
import generateToken from "../config/jwToken";
import { body, validationResult } from "express-validator";
import Superadmin, { ISuperadmin } from "../models/superadminModel";
import uniqid from "uniqid";
import asyncHandler from "express-async-handler";
import generateRefreshedToken from "../config/refreshToken";
import { validateMongodbId } from "../utils/validateMongoId";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail";

//create superadmin
export const createSuperadmin = [
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
      const { adminName, email, password, mobile, role } = req.body;

      const newSuperadmin = new Superadmin({
        adminName,
        email,
        mobile,
        password,
        role: "super-admin",
      });

      await newSuperadmin.save();
      res.status(201).json({
        message: "Superadmin created successfully",
        superadmin: newSuperadmin,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

//login
export const loginCtrl = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    // Check if email or password is missing
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Check if superadmin exists
    const findSuperadmin = await Superadmin.findOne({ email });
    if (!findSuperadmin) {
      res.status(404).json({ message: "Superadmin not found" });
      return;
    }

    if (findSuperadmin.role !== "super-admin") {
      res.status(403).json({ message: "Unauthorized superadmin!" });
      return;
    }

    // Check if password matches
    if (await findSuperadmin.isPasswordMatched(password)) {
      const refreshToken = await generateRefreshedToken(findSuperadmin._id);
      await Superadmin.findByIdAndUpdate(
        findSuperadmin._id,
        { refreshToken },
        { new: true }
      );

      // Set refresh token as a cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000, // 72 hours
      });

      // Respond with the superadmin data and JWT token
      res.json({
        _id: findSuperadmin._id,
        adminName: findSuperadmin.adminName,
        email: findSuperadmin.email,
        role: findSuperadmin.role,
        token: generateToken(findSuperadmin._id),
        refreshToken,
      });
    } else {
      res.status(401).json({ message: "Invalid Credentials!" });
    }
  }
);

//handle refresh Token
export const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("Cookie unavailable!");
  const refreshToken = cookie.refreshToken;
  const superadmin = await Superadmin.findOne({ refreshToken });
  if (!superadmin) throw new Error("No refresh token in database!");
  const secret: string | undefined = process.env.JWT_SECRET;
  if (secret === undefined) {
    throw new Error("JWT_SECRET is required");
  }
  jwt.verify(refreshToken, secret, (err, decoded: any) => {
    if (err || superadmin.id !== decoded.id) {
      throw new Error("Error in refresh token!");
    }
    const accessToken = generateToken(superadmin?._id);
    res.json({ accessToken });
  });
});

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

    const superadmin = await Superadmin.findOne({ refreshToken });

    if (!superadmin) {
      res.removeHeader("refreshToken");
      res.sendStatus(204);
      return;
    }

    await Superadmin.findOneAndUpdate({ refreshToken }, { refreshToken: "" });

    res.removeHeader("refreshToken");

    res.sendStatus(200);
  }
);

//Update a superadmin
export const updateSuperadmin = [
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
      return true; // Return true if validation passes
    }),

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
        // Fetch the superadmin based on ID
        const superadmin = await Superadmin.findById(id);
        if (!superadmin) {
          res
            .status(404)
            .json({ success: false, message: "Superadmin not found" });
          return;
        }

        // Update superadmin details if provided
        superadmin.adminName = req.body.adminName || superadmin.adminName;
        superadmin.email = req.body.email || superadmin.email;
        superadmin.mobile = req.body.mobile || superadmin.mobile;

        // Save the updated superadmin
        const updatedSuperadmin = await superadmin.save();

        res.status(200).json({
          success: true,
          message: "Superadmin updated successfully",
          superadmin: updatedSuperadmin,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error updating superadmin",
          error: error.message,
        });
      }
    }
  ),
];

//get all superadmins
export const getallSuperadmins = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const superadmins = await Superadmin.find();

    res.json(superadmins);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//get a single superadmin
export const getSuperadmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const superadmin = await Superadmin.findById(id);
    res.json(superadmin);
  } catch (e) {
    throw new Error(e);
  }
});

//delete a single superadmin
export const deleteSuperadmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const deleteSuperadmin = await Superadmin.findByIdAndDelete(id);
    res.json(deleteSuperadmin);
  } catch (e) {
    throw new Error(e);
  }
});

// Update password with validation
export const updatePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { _id } = req.body;
  const { password } = req.body;

  validateMongodbId(_id);

  // Validate the password input
  if (!password) {
    res.status(400).json({ message: "Password is required" });
    return;
  }

  if (
    password.length < 6 ||
    !/[A-Z]/.test(password) ||
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    res.status(400).json({
      message:
        "Password must be at least 6 characters long, contain at least one uppercase letter, and at least one special character",
    });
    return;
  }

  try {
    // Find the superadmin by _id
    const superadmin = await Superadmin.findById(_id);

    if (!superadmin) {
      res.status(404).json({ message: "Superadmin not found" });
      return;
    }

    // Hash the new password
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password.toString())
      .digest("hex");
    superadmin.password = hashedPassword;

    // Save the updated superadmin
    const updatedSuperadmin = await superadmin.save();

    res.json({
      message: "Password updated successfully",
      superadmin: updatedSuperadmin,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//forgot password
export const forgotPasswordToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email } = req.body;
    const superadmin = await Superadmin.findOne({ email });

    if (!superadmin) {
      res.status(404).json({ error: "Superadmin not found!" });
      return;
    }

    try {
      const resetToken = await superadmin.createPasswordResetToken();
      await superadmin.save();

      const resetURL = `${process.env.FRONTEND_URL}reset-password/${resetToken}`;
      const emailBody = `
    <h2>Forgot Password?</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetURL}" style="color: blue; font-size: 16px;">Reset Password</a>
  `;
      await sendEmail("Forgot Password Link", email, emailBody);

      res.json({ message: "Reset email sent successfully", resetToken });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// reset Password
export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { password } = req.body;
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const superadmin = await Superadmin.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!superadmin) {
      res.status(400).json({ error: "Token expired or invalid!" });
      return;
    }

    superadmin.password = password;
    superadmin.passwordResetToken = null;
    superadmin.passwordResetExpires = null;
    await superadmin.save();

    res.json({ success: true, message: "Password reset successfully" });
  }
);
