import express from "express";
import {
  createAdmin,
  getallAdmins,
  getAdmin,
  deleteAdmin,
  updateAdmin,
  logout,
  updatePassword,
  loginAdminCtrl,
} from "../controllers/adminControl";
import { authMiddleware, isSuperAdmin } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/register", authMiddleware, isSuperAdmin, createAdmin as any);
router.post("/login", loginAdminCtrl);
router.put("/password", authMiddleware, isSuperAdmin, updatePassword);
router.get("/", authMiddleware, isSuperAdmin, getallAdmins);
router.get("/logout", logout);
router.get("/:id", authMiddleware, isSuperAdmin, getAdmin);
router.delete("/:id", authMiddleware, isSuperAdmin, deleteAdmin);
router.put("/update/:id", authMiddleware, isSuperAdmin, updateAdmin);

export default router;
