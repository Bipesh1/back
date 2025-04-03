import mongoose from "mongoose";

const dbConnect = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URL) {
      throw new Error("MONGODB_URL is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1); // exit if DB connection fails
  }
};

export default dbConnect;
