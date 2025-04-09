import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ObjectId } from "mongodb";

export interface IStudent extends Document {
  _id: string;
  userName: string;
  email: string;
  role: "user";
  password: string;
  mobile: number;
  dob: Date | null;
  maritalStatus: string;
  workExp: string;
  tests: string;
  university: [
    {
      id: mongoose.Schema.Types.ObjectId;
      name: string;
      course: string;
      status: string;
    }
  ];
  counselor: {
    id: mongoose.Schema.Types.ObjectId | null;
    name: string | null;
  };
  wishlist: mongoose.Types.ObjectId[];
  isVerified: boolean;
  mailVerificationToken: string;
  category: string;
  gpa: string;
  link: string;
  passwordChangedAt: Date;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  isPasswordMatched(enteredPassword: string): Promise<boolean>;
  createPasswordResetToken(): string;
  refreshToken: string;
}

const studentSchema = new Schema<IStudent>(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      default: "user",
    },
    category: {
      type: String,
      default: "none",
    },
    gpa: {
      type: String,
    },
    link: {
      type: String,
    },
    dob: {
      type: Date,
    },
    maritalStatus: {
      type: String,
    },
    workExp: {
      type: String,
    },
    tests: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    mailVerificationToken: {
      type: String,
      default: null,
    },
    university: [
      {
        id: { type: Schema.Types.ObjectId, ref: "Course" },
        name: { type: String },
        course: { type: String },
        status: { type: String },
      },
    ],
    counselor: {
      id: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
      name: { type: String, default: null },
    },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "University", default: [] }],
    password: {
      type: String,
      required: true,
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Check if entered password matches hashed password
studentSchema.methods.isPasswordMatched = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash a password reset token
studentSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

  return resetToken;
};

const Student = mongoose.model<IStudent>("Student", studentSchema);

export default Student;