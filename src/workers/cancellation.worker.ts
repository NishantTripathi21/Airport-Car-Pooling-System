import { getChannel, QUEUES } from "../queues/queue.connection.js";
import { acquirePoolLock, releasePoolLock } from "../cache/pool.cache.js";
import { calculateFare } from "../services/pricing.service.js";
import { haversine } from "../services/haversine.js";
import { AIRPORT_LAT, AIRPORT_LNG } from "../config/constants.js";
import {prisma} from "../db/prisma-client/lib.prisma.js";

async function handleCancellation(rideId: string, poolId: string) {
  const workerId = `cancel-worker-${Date.now()}-${Math.random()}`;
  const acquired = await acquirePoolLock(poolId, workerId);

  if (!acquired) {
    throw new Error(`Could not acquire lock on pool ${poolId}, will retry`);
  }

  try {
    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) return;
    const remainingRides = await prisma.ride.findMany({
      where: { poolId, status: { not: "cancelled" } },
      orderBy: { dropOrder: "asc" },
    });

    if (remainingRides.length === 0) {
      await prisma.pool.update({
        where: { id: poolId },
        data: { status: "forming" },
      });
      return;
    }
    const lats = remainingRides.map((r) => r.dropoffLat);
    const lngs = remainingRides.map((r) => r.dropoffLng);
    const updatedRides = remainingRides.map((ride, idx) => {
      let routeDist = 0;
      for (let j = 0; j <= idx; j++) {
        const fromLat = j === 0 ? AIRPORT_LAT : lats[j - 1]!;
        const fromLng = j === 0 ? AIRPORT_LNG : lngs[j - 1]!;
        routeDist += haversine(fromLat, fromLng, lats[j]!, lngs[j]!);
      }
      return {
        ...ride,
        newRouteDist: routeDist,
        newDropOrder: idx + 1,
      };
    });

    const totalRouteDist = updatedRides[updatedRides.length - 1]?.newRouteDist ?? 0;

    const totalSeatsUsed = remainingRides.reduce((sum, r) => sum + r.seatsNeeded, 0);
    const totalLuggageUsed = remainingRides.reduce((sum, r) => sum + r.luggageCount, 0);

    await prisma.$transaction(async (tx) => {
      await tx.pool.update({
        where: { id: poolId },
        data: {
          routeOrder: JSON.stringify(remainingRides.map((r) => r.id)),
          routeDropoffLats: JSON.stringify(lats),
          routeDropoffLngs: JSON.stringify(lngs),
          totalRouteDist,
          totalSeatsUsed,
          totalLuggageUsed,
        },
      });

      for (const ride of updatedRides) {
        const fare = await calculateFare({
          currentRouteDist: ride.newRouteDist,
          directDist: ride.directDist,
          luggageCount: ride.luggageCount,
          passengersInPool: remainingRides.length,
        });

        await tx.ride.update({
          where: { id: ride.id },
          data: {
            currentRouteDist: ride.newRouteDist,
            dropOrder: ride.newDropOrder,
            fare,
          },
        });
      }
    });
  } finally {
    await releasePoolLock(poolId);
  }
}

export function startCancellationWorker() {
  const channel = getChannel();

  channel.prefetch(1);

  channel.consume(QUEUES.RIDE_CANCELLED, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      const { rideId, poolId } = payload;

      console.log(`[cancellation.worker] Processing cancellation: ${rideId}`);

      await handleCancellation(rideId, poolId);

      channel.ack(msg);

      console.log(`[cancellation.worker] Done: ${rideId}`);
    } catch (err) {
      console.error("[cancellation.worker] Error:", err);
      channel.nack(msg, false, true);
    }
  });

  console.log("[cancellation.worker] Listening on", QUEUES.RIDE_CANCELLED);
}