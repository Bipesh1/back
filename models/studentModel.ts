import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ObjectId } from "mongodb";

export interface IStudent extends Document {
  _id: string;
  userName: string;
  gender: string;
  cityOfBirth: string;
  countryOfBirth: string;
  email: string;
  role: "user";
  password: string;
  mobile: number;
  dob: Date | null;
  nationality: string;
  countryOfResidence: string;
  address: string;
  maritalStatus: string;
  workExp: string;
  tests: string;
  whatsapp: string;
  passportNumber: string;
  passportCountry: string;
  passportExpiry: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  emergencyEmail: string;
  hsInstitution: string;
  hsCountry: string;
  hsBoard: string;
  hsEndDate: string;
  hsGrade: string;
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
    gender: {
      type: String,
    },
    cityOfBirth: {
      type: String,
    },
    countryOfBirth: {
      type: String,
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
    nationality: {
      type: String,
    },
    countryOfResidence: {
      type: String,
    },
    address: {
      type: String,
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
    whatsapp: {
      type: String,
    },
    passportNumber: {
      type: String,
    },
    passportCountry: {
      type: String,
    },
    passportExpiry: {
      type: String,
    },
    emergencyName: {
      type: String,
    },
    emergencyRelation: {
      type: String,
    },
    emergencyPhone: {
      type: String,
    },
    emergencyEmail: {
      type: String,
    },
    hsInstitution: {
      type: String,
    },
    hsCountry: {
      type: String,
    },
    hsBoard: {
      type: String,
    },
    hsEndDate: {
      type: String,
    },
    hsGrade: {
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