import { Request, Response } from "express";
import { createRide, getRideStatus, cancelRide } from "../services/ride.service.js";
import { publishRideRequested, publishRideCancelled } from "../queues/ride.publisher.js";

// Request Ride

export async function requestRide(req: Request, res: Response) {
  try {
    const { passengerId, dropoffLat, dropoffLng, seatsNeeded, luggageCount, maxDetourPct } = req.body;

    if (!passengerId || !dropoffLat || !dropoffLng || !seatsNeeded || !luggageCount || !maxDetourPct) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const ride = await createRide({
      passengerId,
      dropoffLat,
      dropoffLng,
      seatsNeeded,
      luggageCount,
      maxDetourPct,
    });

    publishRideRequested({ rideId: ride.id });

    res.status(202).json({ rideId: ride.id, status: ride.status });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

//Get Ride Status

export async function rideStatus(req: Request, res: Response) {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "Ride ID is required" });
      return;
    }

    const status = await getRideStatus(id);
    res.status(200).json(status);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

// Cancel Ride

export async function cancel(req: Request, res: Response) {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "Ride ID is required" });
      return;
    }

    const { poolId } = await cancelRide(id);

    if (poolId) {
      publishRideCancelled({ rideId: id, poolId });
    }

    res.status(200).json({ message: "Ride cancelled" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}