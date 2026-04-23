// src/controllers/driver.controller.ts

import { Request, Response } from "express";
import { registerDriver, goOnDuty, goOffDuty } from "../services/driver.service.js";

// Register Driver 
export async function register(req: Request, res: Response) {
  try {
    const { name, phone, cabId } = req.body;

    if (!name || !phone || !cabId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const driver = await registerDriver(name, phone, cabId);
    res.status(201).json(driver);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// ─── Go On Duty ───────────────────────────────────────────────────────────────

export async function onDuty(req: Request, res: Response) {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      res.status(400).json({ error: "driverId is required" });
      return;
    }

    const result = await goOnDuty(driverId);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// ─── Go Off Duty ──────────────────────────────────────────────────────────────

export async function offDuty(req: Request, res: Response) {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      res.status(400).json({ error: "driverId is required" });
      return;
    }

    const result = await goOffDuty(driverId);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}