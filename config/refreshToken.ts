import jwt from "jsonwebtoken";

const generateRefreshedToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: "3d" });
};

export default generateRefreshedToken;
