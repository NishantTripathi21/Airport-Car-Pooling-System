import {prisma} from "../db/prisma-client/lib.prisma.js";
import { haversine } from "./haversine.js";
import { calculateFare } from "./pricing.service.js";
import { acquirePoolLock, releasePoolLock } from "../cache/pool.cache.js";
import { findEligibleDriver, markDriverBusy } from "../cache/driver.cache.js";
import {
  AIRPORT_LAT,
  AIRPORT_LNG,
  POOL_WINDOW_SECONDS,
  MAX_POOLS_TO_CHECK,
} from "../config/constants.js";


interface RideInput {
  id: string;
  dropoffLat: number;
  dropoffLng: number;
  seatsNeeded: number;
  luggageCount: number;
  maxDetourPct: number;
  directDist: number;
}

interface PooledRide {
  id: string;
  currentRouteDist: number;
  directDist: number;
  maxDetourPct: number;
  dropOrder: number;
  luggageCount: number;
}


async function getFormingPools() {
  const cutoff = new Date(Date.now() - POOL_WINDOW_SECONDS * 1000);

  return prisma.pool.findMany({
    where: {
      status: "forming",
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_POOLS_TO_CHECK,
    include: { cab: true },
  });
}

async function getPooledRides(poolId: string): Promise<PooledRide[]> {
  const rides = await prisma.ride.findMany({
    where: { poolId, status: { not: "cancelled" } },
    orderBy: { dropOrder: "asc" },
  });
     return rides
    .filter((r) => r.currentRouteDist !== null && r.dropOrder !== null)
    .map((r) => ({
      id: r.id,
      currentRouteDist: r.currentRouteDist as number,
      directDist: r.directDist,
      maxDetourPct: r.maxDetourPct,
      dropOrder: r.dropOrder as number,
      luggageCount: r.luggageCount,
    }));
}


function findBestInsertionIndex(
  pool: {
    routeOrder: string;
    routeDropoffLats: string;
    routeDropoffLngs: string;
    totalRouteDist: number;
  },
  existingRides: PooledRide[],
  newRide: RideInput
): { index: number; extraDist: number } | null {
  const lats: number[] = JSON.parse(pool.routeDropoffLats);
  const lngs: number[] = JSON.parse(pool.routeDropoffLngs);
  const k = lats.length;

  let bestIndex: number | null = null;
  let bestExtraDist = Infinity;

  for (let i = 0; i <= k; i++) {
    const prevLat: number = i === 0 ? AIRPORT_LAT : lats[i - 1]!;
    const prevLng: number = i === 0 ? AIRPORT_LNG : lngs[i - 1]!;
    const nextLat: number | null = i === k ? null : lats[i]!;
    const nextLng: number | null = i === k ? null : lngs[i]!;

    let extraDist: number;
    if (nextLat === null || nextLng === null) {
      extraDist = haversine(prevLat, prevLng, newRide.dropoffLat, newRide.dropoffLng);
    } else {
      extraDist =
        haversine(prevLat, prevLng, newRide.dropoffLat, newRide.dropoffLng) +
        haversine(newRide.dropoffLat, newRide.dropoffLng, nextLat, nextLng) -
        haversine(prevLat, prevLng, nextLat, nextLng);
    }

    let prefixDist = 0;
    for (let j = 0; j < i; j++) {
      const fromLat: number = j === 0 ? AIRPORT_LAT : lats[j - 1]!;
      const fromLng: number = j === 0 ? AIRPORT_LNG : lngs[j - 1]!;
      prefixDist += haversine(fromLat, fromLng, lats[j]!, lngs[j]!);
    }
    const dRouteDist =
      prefixDist + haversine(prevLat, prevLng, newRide.dropoffLat, newRide.dropoffLng);

    const dDetour = (dRouteDist - newRide.directDist) / newRide.directDist;

    console.log(`[heuristic] position ${i}: extraDist=${extraDist.toFixed(3)} dRouteDist=${dRouteDist.toFixed(3)} dDetour=${(dDetour * 100).toFixed(2)}% maxAllowed=${newRide.maxDetourPct}%`);

    if (dDetour > newRide.maxDetourPct / 100) {
      console.log(`[heuristic] position ${i}: REJECTED — new ride detour too high`);
      continue;
    }

    let allValid = true;
    for (let j = i; j < existingRides.length; j++) {
      const p = existingRides[j];
      if (p == undefined) continue;
      const simulatedDist = p.currentRouteDist + extraDist;
      const pDetour = (simulatedDist - p.directDist) / p.directDist;

      console.log(`[heuristic] position ${i} passenger ${j}: simulatedDist=${simulatedDist.toFixed(3)} pDetour=${(pDetour * 100).toFixed(2)}% maxAllowed=${p.maxDetourPct}% currentRouteDist=${p.currentRouteDist.toFixed(3)} directDist=${p.directDist.toFixed(3)}`);

      if (pDetour > p.maxDetourPct / 100) {
        console.log(`[heuristic] position ${i}: REJECTED — existing passenger ${j} detour too high`);
        allValid = false;
        break;
      }
    }

    if (allValid && extraDist < bestExtraDist) {
      console.log(`[heuristic] position ${i}: VALID — extraDist=${extraDist.toFixed(3)}`);
      bestIndex = i;
      bestExtraDist = extraDist;
    }
  }

  if (bestIndex === null) {
    console.log(`[heuristic] no valid insertion position found`);
    return null;
  }

  console.log(`[heuristic] best position: ${bestIndex} extraDist=${bestExtraDist.toFixed(3)}`);
  return { index: bestIndex, extraDist: bestExtraDist };
}


async function commitInsertion(
  pool: {
    id: string;
    routeOrder: string;
    routeDropoffLats: string;
    routeDropoffLngs: string;
    totalRouteDist: number;
    totalSeatsUsed: number;
    totalLuggageUsed: number;
  },
  existingRides: PooledRide[],
  newRide: RideInput,
  insertionIndex: number,
  extraDist: number,
  poolSize: number
): Promise<void> {
  const routeOrder: string[] = JSON.parse(pool.routeOrder);
  const lats: number[] = JSON.parse(pool.routeDropoffLats);
  const lngs: number[] = JSON.parse(pool.routeDropoffLngs);

  routeOrder.splice(insertionIndex, 0, newRide.id);
  lats.splice(insertionIndex, 0, newRide.dropoffLat);
  lngs.splice(insertionIndex, 0, newRide.dropoffLng);

  let prefixDist = 0;
  for (let j = 0; j < insertionIndex; j++) {
    const fromLat: number = j === 0 ? AIRPORT_LAT : lats[j - 1]!;
    const fromLng: number = j === 0 ? AIRPORT_LNG : lngs[j - 1]!;
    prefixDist += haversine(fromLat, fromLng, lats[j]!, lngs[j]!);
  }
  const prevLat: number = insertionIndex === 0 ? AIRPORT_LAT : lats[insertionIndex - 1]!;
  const prevLng: number = insertionIndex === 0 ? AIRPORT_LNG : lngs[insertionIndex - 1]!;
  const newRideRouteDist =
    prefixDist + haversine(prevLat, prevLng, newRide.dropoffLat, newRide.dropoffLng);

  const newFare = await calculateFare({
    currentRouteDist: newRideRouteDist,
    directDist: newRide.directDist,
    luggageCount: newRide.luggageCount,
    passengersInPool: poolSize,
  });

  const affectedRides = existingRides.filter((_, idx) => idx >= insertionIndex);

  await prisma.$transaction(async (tx) => {
    await tx.pool.update({
      where: { id: pool.id },
      data: {
        routeOrder: JSON.stringify(routeOrder),
        routeDropoffLats: JSON.stringify(lats),
        routeDropoffLngs: JSON.stringify(lngs),
        totalRouteDist: pool.totalRouteDist + extraDist,
        totalSeatsUsed: pool.totalSeatsUsed + newRide.seatsNeeded,
        totalLuggageUsed: pool.totalLuggageUsed + newRide.luggageCount,
      },
    });

    for (const p of affectedRides) {
      const updatedRouteDist = p.currentRouteDist + extraDist;
      const updatedFare = await calculateFare({
        currentRouteDist: updatedRouteDist,
        directDist: p.directDist,
        luggageCount: p.luggageCount,
        passengersInPool: poolSize,
      });

      await tx.ride.update({
        where: { id: p.id },
        data: {
          currentRouteDist: updatedRouteDist,
          dropOrder: p.dropOrder + 1,
          fare: updatedFare,
        },
      });
    }

    await tx.ride.update({
      where: { id: newRide.id },
      data: {
        poolId: pool.id,
        status: "matched",
        currentRouteDist: newRideRouteDist,
        dropOrder: insertionIndex + 1,
        fare: newFare,
      },
    });
  });
}

// ─── Create New Pool

async function createNewPool(ride: RideInput): Promise<void> {
  const driver = await findEligibleDriver(ride.seatsNeeded, ride.luggageCount);

  if (!driver) return; 
  await markDriverBusy(driver.driverId);

  const driverRecord = await prisma.driver.findUnique({
    where: { id: driver.driverId },
    include: { cab: true },
  });

  if (!driverRecord) return;

  const directDistToDropoff = haversine(
    AIRPORT_LAT,
    AIRPORT_LNG,
    ride.dropoffLat,
    ride.dropoffLng
  );

  const fare = await calculateFare({
    currentRouteDist: directDistToDropoff,
    directDist: ride.directDist,
    luggageCount: ride.luggageCount,
    passengersInPool: 1,
  });

  await prisma.$transaction(async (tx) => {
    const pool = await tx.pool.create({
      data: {
        cabId: driverRecord.cabId,
        driverId: driver.driverId,
        status: "forming",
        totalSeatsUsed: ride.seatsNeeded,
        totalLuggageUsed: ride.luggageCount,
        routeOrder: JSON.stringify([ride.id]),
        routeDropoffLats: JSON.stringify([ride.dropoffLat]),
        routeDropoffLngs: JSON.stringify([ride.dropoffLng]),
        totalRouteDist: directDistToDropoff,
      },
    });

    await tx.ride.update({
      where: { id: ride.id },
      data: {
        poolId: pool.id,
        status: "matched",
        currentRouteDist: directDistToDropoff,
        dropOrder: 1,
        fare,
      },
    });
  });
}


export async function processRide(rideId: string): Promise<void> {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });

  if (!ride || ride.status !== "searching") return;

  const rideInput: RideInput = {
    id: ride.id,
    dropoffLat: ride.dropoffLat,
    dropoffLng: ride.dropoffLng,
    seatsNeeded: ride.seatsNeeded,
    luggageCount: ride.luggageCount,
    maxDetourPct: ride.maxDetourPct,
    directDist: ride.directDist,
  };

  const MAX_ATTEMPTS = 3;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const pools = await getFormingPools();
    if (pools.length === 0) break;

    let bestPoolId: string | null = null;
    let bestInsertionIndex = 0;
    let bestExtraDist = Infinity;

    for (const pool of pools) {
      if (pool.totalSeatsUsed + rideInput.seatsNeeded > pool.cab.totalSeats) continue;
      if (pool.totalLuggageUsed + rideInput.luggageCount > pool.cab.luggageCapacity) continue;

      const existingRides = await getPooledRides(pool.id);
      const result = findBestInsertionIndex(pool, existingRides, rideInput);

      if (result && result.extraDist < bestExtraDist) {
        bestPoolId = pool.id;
        bestInsertionIndex = result.index;
        bestExtraDist = result.extraDist;
      }
    }

    if (!bestPoolId) break; 

    const workerId = `worker-${Date.now()}-${Math.random()}`;
    const acquired = await acquirePoolLock(bestPoolId, workerId);

    if (!acquired) continue;

    try {
      const freshPool = await prisma.pool.findUnique({
        where: { id: bestPoolId },
        include: { cab: true },
      });

      if (!freshPool || freshPool.status !== "forming") continue;

      if (freshPool.totalSeatsUsed + rideInput.seatsNeeded > freshPool.cab.totalSeats) continue;
      if (freshPool.totalLuggageUsed + rideInput.luggageCount > freshPool.cab.luggageCapacity) continue;

      const freshRides = await getPooledRides(bestPoolId);
      const freshResult = findBestInsertionIndex(freshPool, freshRides, rideInput);

      if (!freshResult) continue;
      try {
        await commitInsertion(
          freshPool,
          freshRides,
          rideInput,
          freshResult.index,
          freshResult.extraDist,
          freshRides.length + 1
        );
        return;
      } catch (err) {
        console.error(`[pooling] commitInsertion FAILED:`, err);
        continue;
      }

      return; // successfully inserted
    } finally {
      await releasePoolLock(bestPoolId);
    }
  }

  await createNewPool(rideInput);
}