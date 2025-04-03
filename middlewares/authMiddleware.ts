import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Admin from "../models/adminModel";
import Student from "../models/studentModel";
import Superadmin from "../models/superadminModel";

interface DecodedToken {
  id: string;
}

interface AuthRequest extends Request {
  user?: any;
  userType?: "admin" | "student" | "superadmin";
}

const authMiddleware = asyncHandler(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        res.status(401).json({ message: "No token provided" });
        return;
      }

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        ) as DecodedToken;

        // Check in Superadmin collection
        let admin = await Superadmin.findById(decoded.id);
        if (admin) {
          req.user = admin;
          req.userType = "superadmin";
          next();
          return;
        }

        // Check in Admin collection
        let user = await Admin.findById(decoded.id);
        if (user) {
          req.user = user;
          req.userType = "admin";
          next();
          return;
        }

        // Check in Student collection
        user = await Student.findById(decoded.id);
        if (user) {
          req.user = user;
          req.userType = "student";
          next();
          return;
        }

        res.status(401).json({ message: "User not found" });
        return;
      } catch (e: any) {
        console.error(e.message);
        res.status(401).json({ message: "Token is invalid or expired" });
        return;
      }
    } else {
      res.status(401).json({ message: "Authorization header is missing" });
      return;
    }
  }
);

const isAdminOrSuperAdmin = asyncHandler(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user || req.userType == "student") {
      res
        .status(403)
        .json({ message: "Access denied. Only Admin or Super Admin allowed." });
      return;
    }

    if (req.user.role === "admin" || req.user.role === "super-admin") {
      next();
    } else {
      res
        .status(403)
        .json({ message: "Access denied. Admin or Super Admin required." });
      return;
    }
  }
);

const isSuperAdmin = asyncHandler(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user || req.userType !== "superadmin") {
      res.status(403).json({ message: "Only Super Admin allowed." });
      return;
    }

    if (req.user.role === "super-admin") {
      next();
    } else {
      res.status(403).json({ message: "Access denied. Not a Super Admin." });
      return;
    }
  }
);

const checkUser = asyncHandler(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const token = req.headers.authorization?.split(" ")[1];
    //check token from headers
    if (token) {
      jwt.verify(
        token,
        process.env.JWT_SECRET,
        async (err: any, DecodedToken: { id: any }) => {
          //check for current user
          let user =
            (await Student.findById(DecodedToken.id)) ||
            (await Admin.findById(DecodedToken.id)) ||
            (await Superadmin.findById(DecodedToken.id));
          res.locals.user = user;
          res.status(200).json(user);
        }
      );
    } else {
      res.status(403).json({ message: "No user" });
      return;
    }
  }
);

export { authMiddleware, isAdminOrSuperAdmin, isSuperAdmin, checkUser };
