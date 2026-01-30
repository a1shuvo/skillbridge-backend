import express, { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { categoryController } from "./category.controller";
import { CategoryValidation } from "./category.validation";

const router = express.Router();

router.get("/", categoryController.getAllCategories);

router.post(
  "/",
  auth(UserRole.ADMIN),
  validateRequest(CategoryValidation.createCategorySchema),
  categoryController.createCategory,
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN),
  validateRequest(CategoryValidation.updateCategorySchema),
  categoryController.updateCategory,
);

router.delete("/:id", auth(UserRole.ADMIN), categoryController.deleteCategory);

export const categoryRouter: Router = router;
