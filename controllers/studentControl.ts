import { NextFunction, Request, Response } from "express";
import generateToken from "../config/jwToken";
import { body, validationResult } from "express-validator";
import Student, { IStudent } from "../models/studentModel";
import Admin from "../models/adminModel";
import uniqid from "uniqid";
import asyncHandler from "express-async-handler";
import generateRefreshedToken from "../config/refreshToken";
import { validateMongodbId } from "../utils/validateMongoId";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail";
import University from "../models/universityModel";
import mongoose from "mongoose";

//create student
export const createStudent = [
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
      const { userName, email, password, mobile, category, tests, isVerified } =
        req.body;

      // Generate email verification token
      const mailVerificationToken = crypto.randomBytes(32).toString("hex");

      const newStudent = new Student({
        userName,
        email,
        mobile,
        password,
        role: "user",
        counselor: {
          id: null,
          name: null,
        },
        category: category || "none",
        tests: tests || "none",
        isVerified: false,
        mailVerificationToken,
      });

      await newStudent.save();

      const verifyURL = `https://back-theta-pink.vercel.app/api/user/verify-email/${mailVerificationToken}`;
      //send verification email
      const emailBody = `
        <h2>Verify Your Email!</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verifyURL}" style="color: blue; font-size: 16px;">Verify</a>
        <h2> Pay to activate your dashboard:</h2>
          <img style="width:250px; height:250px; margin:2px" src="cid:khalti" alt="">
          <img style="width:250px; height:250px; margin:2px" src="cid:esewa" alt="">
          <img style="width:250px; height:250px; margin:2px" src="cid:bank" alt="">
      `;
      const subject = "Email Verification";

      await sendEmail(subject, email, emailBody);

      res
        .status(201)
        .json({ message: "Student created successfully", student: newStudent });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

//verify student
export const verifyStudent = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { token } = req.params;

    try {
      // Find student by verification token
      const student = await Student.findOne({ mailVerificationToken: token });

      if (!student) {
        res.status(400).json({
          success: false,
          message: "Invalid or expired verification token.",
        });
        return;
      }

      // Mark student as verified
      student.isVerified = true;
      student.mailVerificationToken = null; // Remove token after verification
      await student.save();

      // Redirect to frontend confirmation page
      res.redirect(`${process.env.FRONTEND_URL}email-verified`);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error verifying email",
        error: error.message,
      });
    }
  }
);

//login
export const loginCtrl = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    // Check if email or password is missing
    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Check if student exists
    const findStudent = await Student.findOne({ email });
    if (!findStudent) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    if (findStudent.role !== "user") {
      res.status(403).json({ message: "Unauthorized student!" });
      return;
    }
    //Check if student email is verified
    if (findStudent.isVerified !== true) {
      const mailVerificationToken = crypto.randomBytes(32).toString("hex");

      findStudent.mailVerificationToken = mailVerificationToken;
      await findStudent.save();

      const verifyURL = `https://back-theta-pink.vercel.app/api/user/verify-email/${mailVerificationToken}`;
      //send verification email
      const emailBody = `
        <h2>Verify Your Email!</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verifyURL}" style="color: blue; font-size: 16px;">Verify</a>
        <h2> Pay to activate your dashboard:</h2>
          <img style="width:250px; height:250px; margin:2px" src="cid:khalti" alt="">
          <img style="width:250px; height:250px; margin:2px" src="cid:esewa" alt="">
          <img style="width:250px; height:250px; margin:2px" src="cid:bank" alt="">
      `;
      const subject = "Email Verification";

      await sendEmail(subject, email, emailBody);
      res.status(400).json({ message: "Verify email!" });
      return;
    }
    // Check if password matches
    if (await findStudent.isPasswordMatched(password)) {
      const refreshToken = await generateRefreshedToken(findStudent._id);
      await Student.findByIdAndUpdate(
        findStudent._id,
        { refreshToken },
        { new: true }
      );

      // Set refresh token as a cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000, // 72 hours
      });

      // Respond with the student data and JWT token
      res.json({
        _id: findStudent._id,
        userName: findStudent.userName,
        email: findStudent.email,
        role: findStudent.role,
        token: generateToken(findStudent._id),
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
  const student = await Student.findOne({ refreshToken });
  if (!student) throw new Error("No refresh token in database!");
  const secret: string | undefined = process.env.JWT_SECRET;
  if (secret === undefined) {
    throw new Error("JWT_SECRET is required");
  }
  jwt.verify(refreshToken, secret, (err, decoded: any) => {
    if (err || student.id !== decoded.id) {
      throw new Error("Error in refresh token!");
    }
    const accessToken = generateToken(student?._id);
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

    const student = await Student.findOne({ refreshToken });

    if (!student) {
      res.removeHeader("refreshToken");
      res.sendStatus(204);
      return;
    }

    await Student.findOneAndUpdate({ refreshToken }, { refreshToken: "" });

    res.removeHeader("refreshToken");

    res.sendStatus(200);
  }
);

//Update a student by admin
export const updateStudentByAdmin = [
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
        const student = await Student.findById(id);
        if (!student) {
          res
            .status(404)
            .json({ success: false, message: "Student not found" });
          return;
        }

        // Update student details if provided
        student.userName = req.body.userName || student.userName;
        student.email = req.body.email || student.email;
        student.category = req.body.category || student.category;

        const stat = req.body.status;

        if (req.body.universityId) {
          if (student.university && Array.isArray(student.university)) {
            const universityIndex = student.university.findIndex((uni) => {
              return (
                uni && uni.id && uni.id.toString() === req.body.universityId
              );
            });

            if (universityIndex !== -1) {
              student.university[universityIndex] = {
                id: student.university[universityIndex].id,
                name: student.university[universityIndex].name,
                status: stat || student.university[universityIndex].status,
              };
            } else {
              res.status(404).json({
                success: false,
                message: "University not found in student's data",
              });
              return;
            }
          } else {
            res.status(400).json({
              success: false,
              message: "Student university data is invalid or not an array",
            });
            return;
          }
        }

        // Save the updated student
        const updatedStudent = await student.save();

        res.status(200).json({
          success: true,
          message: "Student updated successfully",
          student: updatedStudent,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error updating student",
          error: error.message,
        });
      }
    }
  ),
];
//Update a student
export const updateStudent = [
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
        // Fetch the student based on ID
        const student = await Student.findById(id);
        if (!student) {
          res
            .status(404)
            .json({ success: false, message: "Student not found" });
          return;
        }

        // Update student details if provided
        student.workExp = req.body.workExp || student.workExp;
        student.maritalStatus = req.body.maritalStatus || student.maritalStatus;
        student.dob = req.body.dob || student.dob;
        student.gpa = req.body.gpa || student.gpa;
        student.link = req.body.link || student.link;
        student.mobile = req.body.mobile || student.mobile;
        student.tests = req.body.tests || student.tests;

        // Save the updated student
        const updatedStudent = await student.save();

        res.status(200).json({
          success: true,
          message: "Student updated successfully",
          student: updatedStudent,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error updating student",
          error: error.message,
        });
      }
    }
  ),
];

//assign counseler
export const assignCounselor = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    validateMongodbId(id);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      // Fetch the student by ID
      const student = await Student.findById(id);
      if (!student) {
        res.status(404).json({ success: false, message: "Student not found" });
        return;
      }

      // Assign counselor
      const counselorId = req.body.counselor;
      const assign = await Admin.findById(counselorId);

      if (!counselorId) {
        res
          .status(400)
          .json({ success: false, message: "Counselor ID required" });
        return;
      }

      student.counselor = {
        id: assign.id,
        name: assign.adminName,
      };

      const updatedStudent = await student.save();

      // Fetch counselor's email
      const counselor = await Admin.findById(counselorId);
      if (!counselor) {
        res
          .status(404)
          .json({ success: false, message: "Counselor not found" });
        return;
      }

      const email = counselor.email;

      // Send email notification to the assigned counselor
      const emailBody = `
        <h2>Counselor Assigned</h2>
        <p>You have been assigned as a counselor for ${student.userName}.</p>
        <p><strong>Student Details:</strong></p>
        <p>Name: ${student.userName}</p>
        <p>Phone: ${student.mobile}</p>
        <p>Email: ${student.email}</p>
      `;
      const subject = "New Student Assignment";

      await sendEmail(subject, email, emailBody);

      res.status(200).json({
        success: true,
        message: "Counselor assigned successfully and email sent",
        student: updatedStudent,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating student",
        error: error.message,
      });
    }
  }
);

//applied university
export const appliedUni = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        res.status(400).json({ success: false, message: "Token is required" });
        return;
      }

      // verify token
      const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET!);
      const userId = decodedToken.id;

      const student = await Student.findById(userId);
      if (!student) {
        res.status(404).json({ success: false, message: "Student not found" });
        return;
      }

      const uniId = req.body.university;
      if (!uniId) {
        res
          .status(400)
          .json({ success: false, message: "University ID required" });
        return;
      }

      const apply = await University.findById(uniId);
      if (!apply) {
        res
          .status(404)
          .json({ success: false, message: "University not found" });
        return;
      }

      // check if student has already applied to the uni
      const alreadyApplied = student.university.some(
        (uni) => uni.id.toString() === apply.id.toString()
      );
      if (alreadyApplied) {
        res.status(400).json({
          success: false,
          message: "You have already applied to this university.",
        });
        return;
      }

      // apply to uni
      const updatedStudent = await Student.findByIdAndUpdate(
        userId,
        {
          $push: {
            university: {
              id: apply.id,
              name: apply.name,
              status: null,
            },
          },
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Applied to University successfully!",
        student: updatedStudent,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating student",
        error: error.message,
      });
    }
  }
);

//favourite university
export const favouriteUniversity = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        res.status(400).json({ success: false, message: "Token is required" });
        return;
      }

      // verify token
      const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET!);
      const userId = decodedToken.id;

      const student = await Student.findById(userId);
      if (!student) {
        res.status(404).json({ success: false, message: "Student not found" });
        return;
      }

      // add uni to favourite
      const uniId = req.body.wishlist;

      const uni = await University.findById(uniId);
      if (!uni) {
        res
          .status(404)
          .json({ success: false, message: "University not found" });
        return;
      }

      // check if the uni is already in wishlist
      const addedToWishlist = student.wishlist.some(
        (wishlistItem) => wishlistItem.toString() === uniId.toString()
      );

      let updatedStudent;

      if (addedToWishlist) {
        // remove unifrom wishlist
        updatedStudent = await Student.findByIdAndUpdate(
          userId,
          {
            $pull: {
              wishlist: uniId,
            },
          },
          { new: true }
        );
        res.status(200).json({
          success: true,
          message: "University removed from wishlist.",
          student: updatedStudent,
        });
        return;
      } else {
        // add uni to wishlist
        updatedStudent = await Student.findByIdAndUpdate(
          userId,
          {
            $push: {
              wishlist: uniId,
            },
          },
          { new: true }
        );
        res.status(200).json({
          success: true,
          message: "University added to wishlist.",
          student: updatedStudent,
        });
        return;
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating student",
        error: error.message,
      });
      return;
    }
  }
);

//get wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    //check token from headers
    if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRET,
        async (err: any, DecodedToken: { id: any }) => {
          //get user id from headers
          let userId = DecodedToken.id;
          const findUser = await Student.findById(userId).populate({
            path: "wishlist",
            select: "id name",
          });
          res.json(findUser);
        }
      );
    }
  } catch (e) {
    throw new Error(e);
  }
});

//get all students
export const getallStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const students = await Student.find();

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//get a single student
export const getStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const student = await Student.findById(id);
    res.json(student);
  } catch (e) {
    throw new Error(e);
  }
});

//get sudents by adminId/counselorId
export const getStudentsByAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    //check token from headers
    if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRET,
        async (err: any, DecodedToken: { id: any }) => {
          //get admin id from headers
          let counselorId = DecodedToken.id;
          const students = await Student.find({
            "counselor.id": counselorId,
          });
          res.json(students);
        }
      );
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//delete a single student
export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const deleteStudent = await Student.findByIdAndDelete(id);
    res.json(deleteStudent);
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
    // Find the student by _id
    const student = await Student.findById(_id);

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    // Hash the new password
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password.toString())
      .digest("hex");
    student.password = hashedPassword;

    // Save the updated student
    const updatedStudent = await student.save();

    res.json({
      message: "Password updated successfully",
      student: updatedStudent,
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
    const student = await Student.findOne({ email });

    if (!student) {
      res.status(404).json({ error: "Student not found!" });
      return;
    }

    try {
      const resetToken = await student.createPasswordResetToken();
      await student.save();

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

    const student = await Student.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!student) {
      res.status(400).json({ error: "Token expired or invalid!" });
      return;
    }

    student.password = password;
    student.passwordResetToken = null;
    student.passwordResetExpires = null;
    await student.save();

    res.json({ success: true, message: "Password reset successfully" });
  }
);
