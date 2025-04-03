import express from "express";
const router = express.Router();
import upload from "../config/multerConfig";
import {
  createCountry,
  getCountries,
  getCountry,
  updateCountry,
  deleteCountry,
} from "../controllers/countryControl";
import {
  authMiddleware,
  isAdminOrSuperAdmin,
} from "../middlewares/authMiddleware";

router.post(
  "/",
  authMiddleware,
  isAdminOrSuperAdmin,
  upload.single("image"),
  createCountry as any
);
router.get("/", getCountries);
router.get("/:id", getCountry as any);
router.put(
  "/:id",
  authMiddleware,
  isAdminOrSuperAdmin,
  upload.single("image"),
  updateCountry as any
);
router.delete(
  "/:id",
  authMiddleware,
  isAdminOrSuperAdmin,
  deleteCountry as any
);

export default router;
