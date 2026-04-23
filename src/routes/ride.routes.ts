import { Router } from "express";
import { requestRide, rideStatus, cancel } from "../controllers/ride.controller.js";

const router = Router();

router.post("/request", requestRide);
router.get("/:id/status", rideStatus);
router.post("/:id/cancel", cancel);

export default router;