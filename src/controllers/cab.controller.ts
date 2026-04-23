// src/controllers/cab.controller.ts

import { Request, Response } from "express";
import { registerCab } from "../services/cab.service.js";

// Register Cab 

export async function register(req: Request, res: Response) {
  try {
    const { plateNumber, totalSeats, luggageCapacity, cabType } = req.body;

    if (!plateNumber || !totalSeats || !luggageCapacity || !cabType) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const cab = await registerCab(plateNumber, totalSeats, luggageCapacity, cabType);
    res.status(201).json(cab);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}