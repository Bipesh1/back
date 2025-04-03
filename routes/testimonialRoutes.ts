import express from "express";
const router = express.Router();
import upload from "../config/multerConfig";
import {
  createTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialControl";
import {
  authMiddleware,
  isAdminOrSuperAdmin,
} from "../middlewares/authMiddleware";

router.post(
  "/",
  authMiddleware,
  isAdminOrSuperAdmin,
  upload.single("image"),
  createTestimonial as any
);
router.get("/", getTestimonials);
router.get("/:id", getTestimonial as any);
router.put(
  "/:id",
  authMiddleware,
  isAdminOrSuperAdmin,
  upload.single("image"),
  updateTestimonial as any
);
router.delete(
  "/:id",
  authMiddleware,
  isAdminOrSuperAdmin,
  deleteTestimonial as any
);

export default router;
