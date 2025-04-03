import express from "express";
const router = express.Router();
import upload from "../config/multerConfig";
import {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blogControl";
import {
  authMiddleware,
  isAdminOrSuperAdmin,
} from "../middlewares/authMiddleware";

router.post(
  "/",
  authMiddleware,
  isAdminOrSuperAdmin,
  upload.array("images", 10),
  createBlog as any
);
router.get("/", getBlogs);
router.get("/:id", getBlog as any);
router.put(
  "/:id",
  authMiddleware,
  isAdminOrSuperAdmin,
  upload.array("images", 10),
  updateBlog as any
);
router.delete("/:id", authMiddleware, isAdminOrSuperAdmin, deleteBlog as any);

export default router;
