import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface ICourse extends Document {
  title: string;
  priority: number;
  category: string;
  university: {
    id: mongoose.Schema.Types.ObjectId;
    name: string;
    slug: string;
  };
  qualification: string;
  earliestIntake: string;
  deadline: string;
  duration: string;
  entryScore: string;
  fee: string;
  scholarship: string;
  stream: string;
  overview: string;
  tags: string;
  slug: string;
}

const courseSchema = new mongoose.Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
    },
    university: {
      id: { type: Schema.Types.ObjectId, ref: "University", required: true },
      name: { type: String, required: true },
      slug: { type: String, required: true },
    },
    qualification: {
      type: String,
    },
    earliestIntake: {
      type: String,
    },
    deadline: {
      type: String,
    },
    duration: {
      type: String,
    },
    entryScore: {
      type: String,
    },
    fee: {
      type: String,
    },
    scholarship: {
      type: String,
    },
    stream: {
      type: String,
    },
    overview: {
      type: String,
    },
    slug: {
      type: String,
      required: true,
    },
    tags: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model<ICourse>("Course", courseSchema);

export default Course;