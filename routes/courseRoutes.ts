import express from "express";
const router = express.Router();
import {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  getCourseByUniversity,
} from "../controllers/courseControl";
import {
  authMiddleware,
  isAdminOrSuperAdmin,
} from "../middlewares/authMiddleware";

router.post("/", authMiddleware, isAdminOrSuperAdmin, createCourse as any);
router.get("/", getCourses);
router.get("/:id", getCourse as any);
router.get("/university/:uni", getCourseByUniversity as any);
router.put("/:id", authMiddleware, isAdminOrSuperAdmin, updateCourse as any);
router.delete("/:id", authMiddleware, isAdminOrSuperAdmin, deleteCourse as any);

export default router;
