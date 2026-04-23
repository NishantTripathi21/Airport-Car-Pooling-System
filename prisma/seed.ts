import {prisma} from "../src/db/prisma-client/lib.prisma.js"

async function main() {
  const cab1 = await prisma.cab.upsert({
    where: { plateNumber: "PB01AB1234" },
    update: {},
    create: {
      plateNumber: "PB01AB1234",
      totalSeats: 4,
      luggageCapacity: 4,
      cabType: "suv",
    },
  });

  const cab2 = await prisma.cab.upsert({
    where: { plateNumber: "PB01CD5678" },
    update: {},
    create: {
      plateNumber: "PB01CD5678",
      totalSeats: 3,
      luggageCapacity: 3,
      cabType: "sedan",
    },
  });

  const cab3 = await prisma.cab.upsert({
    where: { plateNumber: "PB01EF9012" },
    update: {},
    create: {
      plateNumber: "PB01EF9012",
      totalSeats: 6,
      luggageCapacity: 6,
      cabType: "van",
    },
  });

  console.log("Cabs seeded:", cab1.plateNumber, cab2.plateNumber, cab3.plateNumber);

  // ─── Drivers ───────────────────────────────────────────────────────────────

  const driver1 = await prisma.driver.upsert({
    where: { phone: "9876543210" },
    update: {},
    create: {
      name: "Rajesh Kumar",
      phone: "9876543210",
      cabId: cab1.id,
    },
  });

  const driver2 = await prisma.driver.upsert({
    where: { phone: "9876543211" },
    update: {},
    create: {
      name: "Amit Singh",
      phone: "9876543211",
      cabId: cab2.id,
    },
  });

  const driver3 = await prisma.driver.upsert({
    where: { phone: "9876543212" },
    update: {},
    create: {
      name: "Suresh Sharma",
      phone: "9876543212",
      cabId: cab3.id,
    },
  });

  console.log("Drivers seeded:", driver1.name, driver2.name, driver3.name);

  // ─── Passengers ────────────────────────────────────────────────────────────

  const p1 = await prisma.passenger.upsert({
    where: { phone: "9000000001" },
    update: {},
    create: { name: "Ananya Sharma", phone: "9000000001" },
  });

  const p2 = await prisma.passenger.upsert({
    where: { phone: "9000000002" },
    update: {},
    create: { name: "Rohan Mehta", phone: "9000000002" },
  });

  const p3 = await prisma.passenger.upsert({
    where: { phone: "9000000003" },
    update: {},
    create: { name: "Priya Nair", phone: "9000000003" },
  });

  const p4 = await prisma.passenger.upsert({
    where: { phone: "9000000004" },
    update: {},
    create: { name: "Karan Verma", phone: "9000000004" },
  });

  console.log("Passengers seeded:", p1.name, p2.name, p3.name, p4.name);

  //Print IDs for Postman testing

  console.log("\n── IDs for testing ───────────────────");
  console.log("Drivers:");
  console.log(`  ${driver1.name}: ${driver1.id}`);
  console.log(`  ${driver2.name}: ${driver2.id}`);
  console.log(`  ${driver3.name}: ${driver3.id}`);
  console.log("Passengers:");
  console.log(`  ${p1.name}: ${p1.id}`);
  console.log(`  ${p2.name}: ${p2.id}`);
  console.log(`  ${p3.name}: ${p3.id}`);
  console.log(`  ${p4.name}: ${p4.id}`);
  console.log("─────────────────────────\n");
}

const moreCabsData = [
  { plateNumber: "PB01GH1111", totalSeats: 4, luggageCapacity: 3, cabType: "sedan" },
  { plateNumber: "PB01GH2222", totalSeats: 6, luggageCapacity: 5, cabType: "suv" },
  { plateNumber: "PB01GH3333", totalSeats: 7, luggageCapacity: 6, cabType: "van" },
  { plateNumber: "PB01GH4444", totalSeats: 4, luggageCapacity: 2, cabType: "sedan" },
  { plateNumber: "PB01GH5555", totalSeats: 5, luggageCapacity: 4, cabType: "suv" },
  { plateNumber: "PB01GH6666", totalSeats: 6, luggageCapacity: 5, cabType: "van" },
  { plateNumber: "PB01GH7777", totalSeats: 4, luggageCapacity: 3, cabType: "sedan" },
  { plateNumber: "PB01GH8888", totalSeats: 5, luggageCapacity: 4, cabType: "suv" },
  { plateNumber: "PB01GH9999", totalSeats: 7, luggageCapacity: 6, cabType: "van" },
  { plateNumber: "PB01GH0000", totalSeats: 4, luggageCapacity: 3, cabType: "sedan" },
];

const moreCabs = [];
for (const cab of moreCabsData) {
  const created = await prisma.cab.upsert({
    where: { plateNumber: cab.plateNumber },
    update: {},
    create: cab,
  });
  moreCabs.push(created);
}

const moreDriversData = [
  { name: "Vikram Singh", phone: "9876500001" },
  { name: "Ravi Kumar", phone: "9876500002" },
  { name: "Manoj Sharma", phone: "9876500003" },
  { name: "Deepak Verma", phone: "9876500004" },
  { name: "Sanjay Patel", phone: "9876500005" },
  { name: "Arjun Reddy", phone: "9876500006" },
  { name: "Nitin Joshi", phone: "9876500007" },
  { name: "Kunal Mehta", phone: "9876500008" },
  { name: "Rahul Das", phone: "9876500009" },
  { name: "Harsh Gupta", phone: "9876500010" },
];

const moreDrivers = [];
for (let i = 0; i < moreDriversData.length; i++) {
  const driver = await prisma.driver.upsert({
    where: { phone: moreDriversData[i].phone },
    update: {},
    create: {
      ...moreDriversData[i],
      cabId: moreCabs[i].id, // mapping 1:1
    },
  });
  moreDrivers.push(driver);
}

const morePassengersData = [
  { name: "Neha Kapoor", phone: "9000000011" },
  { name: "Aditya Roy", phone: "9000000012" },
  { name: "Sneha Iyer", phone: "9000000013" },
  { name: "Varun Dhawan", phone: "9000000014" },
  { name: "Pooja Hegde", phone: "9000000015" },
  { name: "Alok Nath", phone: "9000000016" },
  { name: "Ritika Singh", phone: "9000000017" },
  { name: "Yash Verma", phone: "9000000018" },
  { name: "Tanvi Shah", phone: "9000000019" },
  { name: "Mohit Jain", phone: "9000000020" },
];

const morePassengers = await Promise.all(
  morePassengersData.map((p) =>
    prisma.passenger.upsert({
      where: { phone: p.phone },
      update: {},
      create: p,
    })
  )
);

main()

  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });