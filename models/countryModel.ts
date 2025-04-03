import mongoose, { Schema, Document, Model } from "mongoose";

interface IImage {
  url: string;
  public_id: string;
  filename: string;
  contentType: string;
  path: string;
}

interface ICountry extends Document {
  image: IImage;
  imageAlt: string;
  publicUni: {
    undergraduate: string;
    masters: string;
  };
  privateUni: {
    undergraduate: string;
    masters: string;
  };
  general: {
    undergraduate: string;
    masters: string;
    mba: string;
  };
  name: string;
  priority: number;
}

var countrySchema = new mongoose.Schema<ICountry>(
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
    publicUni: {
      undergraduate: { type: String },
      masters: { type: String },
    },
    privateUni: {
      undergraduate: { type: String },
      masters: { type: String },
    },
    general: {
      undergraduate: { type: String },
      masters: { type: String },
      mba: { type: String },
    },
    name: {
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

const Country = mongoose.model<ICountry>("Country", countrySchema);
export default Country;
