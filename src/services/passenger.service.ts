import {prisma} from "../db/prisma-client/lib.prisma.js";

// regster client

export async function registerPassenger(name: string, phone: string) {
  const existing = await prisma.passenger.findUnique({ where: { phone } });
  if (existing) throw new Error("Phone number already registered");
  return prisma.passenger.create({ data: { name, phone } });
}