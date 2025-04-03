import mongoose, { Schema, Document, Model, ObjectId } from "mongoose";

interface IImage {
  url: string;
  public_id: string;
  filename: string;
  contentType: string;
  path: string;
}

interface IUniversity extends Document {
  priority: number;
  name: string;
  slug: string;
  admissionOpen: boolean;
  country: {
    id: mongoose.Schema.Types.ObjectId;
    name: string;
  };
  category: string;
  address: string;
  link: string;
  email: string;
  fb: string;
  insta: string;
  x: string;
  phone: string;
  syllabus: string;
  estdDate: Date;
  deamMsg: string;
  scholarship: string;
  content: string;
  test: string;
  applyfee: string;
  image: IImage;
  uniLogo: IImage;
  imageAlt: string;
  tags: string;
}

const universitySchema = new Schema<IUniversity>(
  {
    priority: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
    },
    country: {
      id: { type: Schema.Types.ObjectId, ref: "Country", required: true },
      name: { type: String, required: true },
    },
    admissionOpen: {
      type: Boolean,
    },
    category: {
      type: String,
    },
    address: {
      type: String,
    },
    link: {
      type: String,
    },
    email: {
      type: String,
    },
    fb: {
      type: String,
    },
    insta: {
      type: String,
    },
    x: {
      type: String,
    },
    phone: {
      type: String,
    },
    syllabus: {
      type: String,
    },
    estdDate: {
      type: Date,
    },
    deamMsg: {
      type: String,
    },
    scholarship: {
      type: String,
    },
    content: {
      type: String,
    },
    test: {
      type: String,
    },
    applyfee: {
      type: String,
    },
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      filename: { type: String },
      contentType: { type: String },
      path: { type: String },
    },
    uniLogo: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      filename: { type: String },
      contentType: { type: String },
      path: { type: String },
    },
    imageAlt: {
      type: String,
    },
    tags: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const University: Model<IUniversity> = mongoose.model<IUniversity>(
  "University",
  universitySchema
);

export default University;
