import { Router } from "express";
import { register } from "../controllers/passenger.controller.js";

const router = Router();

router.post("/", register);

export default router;