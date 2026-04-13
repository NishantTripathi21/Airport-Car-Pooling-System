import {prisma} from "../db/prisma-client/lib.prisma.js";
import { haversine } from "./haversine.js";
import { AIRPORT_LAT, AIRPORT_LNG } from "../config/constants.js";

// input
export interface CreateRideInput {
  passengerId: string;
  dropoffLat: number;
  dropoffLng: number;
  seatsNeeded: number;
  luggageCount: number;
  maxDetourPct: number;
}

export async function createRide(input: CreateRideInput) {
  const { passengerId, dropoffLat, dropoffLng, seatsNeeded, luggageCount, maxDetourPct } = input;

  const passenger = await prisma.passenger.findUnique({
    where: { id: passengerId },
  });
  if (!passenger) throw new Error("Passenger not found");

  const directDist = haversine(AIRPORT_LAT, AIRPORT_LNG, dropoffLat, dropoffLng);

  const ride = await prisma.ride.create({
    data: {
      passengerId,
      dropoffLat,
      dropoffLng,
      seatsNeeded,
      luggageCount,
      maxDetourPct,
      directDist,
      status: "searching",
    },
  });

  return ride;
}

export async function getRideStatus(rideId: string) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: {
      pool: {
        include: {
          driver: {
            include: { cab: true },
          },
        },
      },
    },
  });

  if (!ride) throw new Error("Ride not found");

  if (ride.status === "searching") {
    return {
      rideId: ride.id,
      status: ride.status,
    };
  }

  const poolSize = ride.pool
    ? await prisma.ride.count({
        where: { poolId: ride.poolId!, status: { not: "cancelled" } },
      })
    : null;

  return {
    rideId: ride.id,
    status: ride.status,
    dropOrder: ride.dropOrder,
    poolSize,
    fare: ride.fare,
    driver: ride.pool
      ? {
          name: ride.pool.driver.name,
          phone: ride.pool.driver.phone,
          cab: {
            plate: ride.pool.driver.cab.plateNumber,
            type: ride.pool.driver.cab.cabType,
          },
        }
      : null,
  };
}


// Marks ride as cancelled and returns poolId so the controller
// can publish the cancellation event
export async function cancelRide(rideId: string) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });

  if (!ride) throw new Error("Ride not found");

  if (ride.status === "cancelled") throw new Error("Ride already cancelled");

  if (ride.status === "completed") throw new Error("Cannot cancel a completed ride");

  await prisma.ride.update({
    where: { id: rideId },
    data: { status: "cancelled" },
  });

  // Return poolId so controller knows whether to publish ride.cancelled event.
  // If poolId is null the ride was never matched — no re-pooling needed.
  return { poolId: ride.poolId };
}