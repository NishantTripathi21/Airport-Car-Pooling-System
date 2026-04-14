import {prisma} from "../db/prisma-client/lib.prisma.js";
import { addDriverToCache, removeDriverFromCache } from "../cache/driver.cache.js";


export async function registerDriver(
  name: string,
  phone: string,
  cabId: string
) {
  const existing = await prisma.driver.findUnique({ where: { phone } });
  if (existing) throw new Error("Phone number already registered");

  const cab = await prisma.cab.findUnique({ where: { id: cabId } });
  if (!cab) throw new Error("Cab not found");

  const cabTaken = await prisma.driver.findUnique({ where: { cabId } });
  if (cabTaken) throw new Error("Cab already assigned to another driver");

  return prisma.driver.create({ data: { name, phone, cabId } });
}


// Fetches cab capacity from DB and stores driver in Redis as available.
export async function goOnDuty(driverId: string) {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { cab: true },
  });

  if (!driver) throw new Error("Driver not found");

  await addDriverToCache({
    driverId: driver.id,
    status: "available",
    seatsAvailable: driver.cab.totalSeats,
    luggageCapacity: driver.cab.luggageCapacity,
  });

  return { message: "Driver is now on duty" };
}

// Removes driver from Redis
export async function goOffDuty(driverId: string) {
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error("Driver not found");

  await removeDriverFromCache(driverId);

  return { message: "Driver is now off duty" };
}