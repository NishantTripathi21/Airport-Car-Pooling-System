import { Router } from "express";
import { register, onDuty, offDuty } from "../controllers/driver.controller.js";

const router = Router();

router.post("/", register);
router.post("/duty", onDuty);
router.delete("/duty", offDuty);

export default router;