import express from "express";
const router = express.Router();
import upload from "../config/multerConfig";
import {
  createUniversity,
  getUniversities,
  getUniversity,
  updateUniversity,
  deleteUniversity,
  getUniversityByCountry,
} from "../controllers/universityControl";
import {
  authMiddleware,
  isAdminOrSuperAdmin,
} from "../middlewares/authMiddleware";

router.post(
  "/",
  authMiddleware,
  isAdminOrSuperAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "uniLogo", maxCount: 1 },
  ]),
  createUniversity as any
);
router.get("/", getUniversities);
router.get("/:id", getUniversity as any);
router.get("/country/:country", getUniversityByCountry as any);
router.put(
  "/:id",
  authMiddleware,
  isAdminOrSuperAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "uniLogo", maxCount: 1 },
  ]),
  updateUniversity as any
);
router.delete(
  "/:id",
  authMiddleware,
  isAdminOrSuperAdmin,
  deleteUniversity as any
);

export default router;
