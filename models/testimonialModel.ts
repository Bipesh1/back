import mongoose, { Schema, Document, Model, ObjectId } from "mongoose";

interface IImage {
  url: string;
  public_id: string;
  filename: string;
  contentType: string;
  path: string;
}

interface ITestimonial extends Document {
  image: IImage;
  imageAlt: string;
  name: string;
  post: string;
  review: string;
  priority: number;
}

var testimonialSchema = new mongoose.Schema<ITestimonial>(
  {
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      filename: { type: String },
      contentType: { type: String },
      path: { type: String },
    },
    imageAlt: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    post: {
      type: String,
      required: true,
    },
    review: {
      type: String,
      required: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Testimonial = mongoose.model<ITestimonial>(
  "Testimonial",
  testimonialSchema
);
export default Testimonial;
