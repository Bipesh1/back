import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ObjectId } from "mongodb";

export interface IAdmin extends Document {
  _id: string;
  adminName: string;
  email: string;
  role: "admin";
  password: string;
  mobile: number;
  passwordChangedAt: Date;
  passwordResetToken: string | null;
  passwordResetExpires: number | Date | null;
  isPasswordMatched(enteredPassword: string): Promise<boolean>;
  createPasswordResetToken(): Promise<string>;
  refreshToken: string;
}

const adminSchema = new Schema<IAdmin>(
  {
    adminName: {
      type: String,
      required: true,
      unique: true,
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
      default: "admin",
    },
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
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSaltSync(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Check if entered password matches hashed password
adminSchema.methods.isPasswordMatched = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash a password reset token
adminSchema.methods.createPasswordResetToken =
  async function (): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    return resetToken;
  };

const Admin = mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;
