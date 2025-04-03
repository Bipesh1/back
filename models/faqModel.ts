import mongoose, { Schema, Document, Model, ObjectId } from "mongoose";

interface IFaq extends Document {
  ques: string;
  ans: string;
  country: {
    id: mongoose.Schema.Types.ObjectId;
    name: string;
  };
  priority: number;
}

var faqSchema = new mongoose.Schema<IFaq>(
  {
    ques: {
      type: String,
      required: true,
    },
    ans: {
      type: String,
      required: true,
    },
    country: {
      id: { type: Schema.Types.ObjectId, ref: "Country" },
      name: { type: String },
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

const Faq = mongoose.model<IFaq>("Faq", faqSchema);
export default Faq;
