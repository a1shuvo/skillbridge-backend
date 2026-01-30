
import express, { Router } from "express";
import { categoryController } from "./category.controller";

const router = express.Router();

router.get("/", categoryController.getAllCategories);

export const categoryRouter:Router = router;