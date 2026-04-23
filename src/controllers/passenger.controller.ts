// src/controllers/passenger.controller.ts

import { Request, Response } from "express";
import { registerPassenger } from "../services/passenger.service.js";

//Register Passenger 

export async function register(req: Request, res: Response) {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const passenger = await registerPassenger(name, phone);
    res.status(201).json(passenger);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}