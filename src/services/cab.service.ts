import {prisma} from "../db/prisma-client/lib.prisma.js";

export async function registerCab(
  plateNumber: string,
  totalSeats: number,
  luggageCapacity: number,
  cabType: string
) {
  const existing = await prisma.cab.findUnique({ where: { plateNumber } });
  if (existing) throw new Error("Cab with this plate already registered");

  return prisma.cab.create({
    data: { plateNumber, totalSeats, luggageCapacity, cabType },
  });
}