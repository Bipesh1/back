import express, { Router } from "express";
const router: Router = express.Router();
import {
  createFaq,
  getFaqs,
  getFaq,
  updateFaq,
  deleteFaq,
  getFaqByCountry,
} from "../controllers/faqControl";
import {
  authMiddleware,
  isAdminOrSuperAdmin,
} from "../middlewares/authMiddleware";

router.post("/", authMiddleware, isAdminOrSuperAdmin, createFaq as any);
router.get("/", getFaqs);
router.get("/:id", getFaq as any);
router.get("/country/:country", getFaqByCountry as any);
router.put("/:id", authMiddleware, isAdminOrSuperAdmin, updateFaq as any);
router.delete("/:id", authMiddleware, isAdminOrSuperAdmin, deleteFaq as any);

export default router;
