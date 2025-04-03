import mongoose, { Schema, Document, Model, ObjectId } from "mongoose";

interface IImage {
  url: string;
  public_id: string;
  filename: string;
  contentType: string;
  path: string;
}

interface IBlog extends Document {
  priority: number;
  title: string;
  slug: string;
  category: string;
  content: string;
  images: IImage[];
  tags: string;
}

const blogSchema = new Schema<IBlog>(
  {
    priority: {
      type: Number,
      default: 0,
    },
    title: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
    },

    category: {
      type: String,
    },
    content: {
      type: String,
    },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        filename: { type: String },
        contentType: { type: String },
        path: { type: String },
      },
    ],
    tags: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Blog: Model<IBlog> = mongoose.model<IBlog>("Blog", blogSchema);

export default Blog;
