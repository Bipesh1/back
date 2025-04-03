import express from "express";
import {
  createStudent,
  getallStudents,
  getStudent,
  deleteStudent,
  updateStudent,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginCtrl,
  assignCounselor,
  verifyStudent,
  getStudentsByAdmin,
  favouriteUniversity,
  getWishlist,
  appliedUni,
  updateStudentByAdmin,
} from "../controllers/studentControl";
import {
  authMiddleware,
  isAdminOrSuperAdmin,
  isSuperAdmin,
} from "../middlewares/authMiddleware";
import passport from "passport";

const router = express.Router();

router.post("/register", createStudent as any);
router.post("/login", loginCtrl);
router.post("/forgot-password-token", forgotPasswordToken);
router.put("/reset-password/:token", resetPassword);
router.get("/verify-email/:token", verifyStudent);
router.put("/password", authMiddleware, updatePassword);
router.put("/wishlist", authMiddleware, favouriteUniversity);
router.put("/apply", authMiddleware, appliedUni);
router.get("/wishlist", authMiddleware, getWishlist);
router.get("/", authMiddleware, isAdminOrSuperAdmin, getallStudents);
router.get("/refresh-token", handleRefreshToken);
router.get("/logout", authMiddleware, logout);
router.get("/get-student/:id", authMiddleware, isAdminOrSuperAdmin, getStudent);
router.get(
  "/bycounselor",
  authMiddleware,
  isAdminOrSuperAdmin,
  getStudentsByAdmin
);
router.delete("/:id", authMiddleware, isSuperAdmin, deleteStudent);
router.put(
  "/update-by-admin/:id",
  authMiddleware,
  isAdminOrSuperAdmin,
  updateStudentByAdmin
);
router.put("/update/:id", updateStudent);
router.put(
  "/assign-counselor/:id",
  authMiddleware,
  isSuperAdmin,
  assignCounselor
);

export default router;
