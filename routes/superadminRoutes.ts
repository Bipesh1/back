import express from "express";
import {
  createSuperadmin,
  getallSuperadmins,
  getSuperadmin,
  deleteSuperadmin,
  updateSuperadmin,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginCtrl,
} from "../controllers/superadminControl";
import { authMiddleware, isSuperAdmin } from "../middlewares/authMiddleware";
import passport from "passport";

const router = express.Router();

router.post("/register", authMiddleware, isSuperAdmin, createSuperadmin as any);
router.post("/login", loginCtrl);
router.post("/forgot-password-token", forgotPasswordToken);
router.put("/reset-password/:token", resetPassword);
router.put("/password", authMiddleware, updatePassword);
router.get("/", getallSuperadmins);
router.get("/refresh-token", handleRefreshToken);
router.get("/logout", logout);
router.get("/:id", authMiddleware, isSuperAdmin, getSuperadmin);
router.delete("/:id", authMiddleware, isSuperAdmin, deleteSuperadmin);
router.put("/update/:id", authMiddleware, isSuperAdmin, updateSuperadmin);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: process.env.CLIENT_URL,
  })
);

export default router;
