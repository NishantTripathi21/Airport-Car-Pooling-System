import {prisma} from "../src/db/prisma-client/lib.prisma.js"

async function main() {
  const cabData = [
    { plateNumber: "PB01AB1234", totalSeats: 4, luggageCapacity: 4, cabType: "suv" },
    { plateNumber: "PB01CD5678", totalSeats: 3, luggageCapacity: 3, cabType: "sedan" },
    { plateNumber: "PB01EF9012", totalSeats: 6, luggageCapacity: 6, cabType: "van" },
    { plateNumber: "PB01GH1111", totalSeats: 4, luggageCapacity: 4, cabType: "suv" },
    { plateNumber: "PB01GH2222", totalSeats: 3, luggageCapacity: 3, cabType: "sedan" },
    { plateNumber: "PB01GH3333", totalSeats: 6, luggageCapacity: 6, cabType: "van" },
    { plateNumber: "PB01GH4444", totalSeats: 4, luggageCapacity: 4, cabType: "suv" },
    { plateNumber: "PB01GH5555", totalSeats: 4, luggageCapacity: 5, cabType: "suv" },
    { plateNumber: "PB01GH6666", totalSeats: 5, luggageCapacity: 6, cabType: "van" },
    { plateNumber: "PB01GH7777", totalSeats: 3, luggageCapacity: 4, cabType: "sedan" },
  ];

  const cabs = [];
  for (const cab of cabData) {
    const c = await prisma.cab.upsert({
      where: { plateNumber: cab.plateNumber },
      update: {},
      create: cab,
    });
    cabs.push(c);
  }
  console.log(`Cabs seeded `);

  const driverData = [
    { name: "Rajesh Kumar",  phone: "9876543210" },
    { name: "Amit Singh",    phone: "9876543211" },
    { name: "Suresh Sharma", phone: "9876543212" },
    { name: "Vikram Nair",   phone: "9876543213" },
    { name: "Deepak Mehta",  phone: "9876543214" },
    { name: "Arun Verma",    phone: "9876543215" },
    { name: "Sanjay Das",    phone: "9876543216" },
    { name: "Kiran Patel",   phone: "9876543217" },
    { name: "Manoj Reddy",   phone: "9876543218" },
    { name: "Nitin Joshi",   phone: "9876543219" },
  ];

  const drivers = [];
  for (let i = 0; i < driverData.length; i++) {
    const d = await prisma.driver.upsert({
      where: { phone: driverData[i]!.phone },
      update: {},
      create: {
        name: driverData[i]!.name,
        phone: driverData[i]!.phone,
        cabId: cabs[i]!.id,
      },
    });
    drivers.push(d);
  }
  console.log(`Drivers seeded`);
  const passengerData = [
    { name: "Ananya Sharma",  phone: "9000000001" },
    { name: "Rohan Mehta",    phone: "9000000002" },
    { name: "Priya Nair",     phone: "9000000003" },
    { name: "Karan Verma",    phone: "9000000004" },
    { name: "Sneha Iyer",     phone: "9000000005" },
    { name: "Arjun Patel",    phone: "9000000006" },
    { name: "Divya Reddy",    phone: "9000000007" },
    { name: "Rahul Das",      phone: "9000000008" },
    { name: "Pooja Singh",    phone: "9000000009" },
    { name: "Vikash Kumar",   phone: "9000000010" },
    { name: "Neha Kapoor",    phone: "9000000011" },
    { name: "Aditya Roy",     phone: "9000000012" },
    { name: "Meera Joshi",    phone: "9000000013" },
    { name: "Sunil Gupta",    phone: "9000000014" },
    { name: "Kavya Nair",     phone: "9000000015" },
    { name: "Alok Nath",      phone: "9000000016" },
    { name: "Ritika Singh",   phone: "9000000017" },
    { name: "Yash Verma",     phone: "9000000018" },
    { name: "Tanvi Shah",     phone: "9000000019" },
    { name: "Mohit Jain",     phone: "9000000020" },
    { name: "Sanya Khanna",   phone: "9000000021" },
    { name: "Ravi Teja",      phone: "9000000022" },
    { name: "Ishaan Malhotra",phone: "9000000023" },
    { name: "Puja Agarwal",   phone: "9000000024" },
    { name: "Nikhil Bose",    phone: "9000000025" },
    { name: "Shruti Pandey",  phone: "9000000026" },
    { name: "Abhishek Rao",   phone: "9000000027" },
    { name: "Ankita Mishra",  phone: "9000000028" },
    { name: "Harsh Sinha",    phone: "9000000029" },
    { name: "Simran Kaur",    phone: "9000000030" },
    { name: "Varun Dhawan",   phone: "9000000031" },
    { name: "Naina Saxena",   phone: "9000000032" },
    { name: "Rohit Sharma",   phone: "9000000033" },
    { name: "Pallavi Menon",  phone: "9000000034" },
    { name: "Aman Bajaj",     phone: "9000000035" },
    { name: "Kritika Sethi",  phone: "9000000036" },
    { name: "Gaurav Chopra",  phone: "9000000037" },
    { name: "Tanya Bhatt",    phone: "9000000038" },
    { name: "Manish Trivedi", phone: "9000000039" },
    { name: "Sonal Desai",    phone: "9000000040" },
    { name: "Kunal Ahuja",    phone: "9000000041" },
    { name: "Richa Srivastava",phone: "9000000042" },
    { name: "Parth Oberoi",   phone: "9000000043" },
    { name: "Disha Thakur",   phone: "9000000044" },
    { name: "Ayush Bansal",   phone: "9000000045" },
    { name: "Nidhi Choudhary",phone: "9000000046" },
    { name: "Siddharth Gill", phone: "9000000047" },
    { name: "Bhavna Mathur",  phone: "9000000048" },
    { name: "Kartik Arora",   phone: "9000000049" },
    { name: "Zara Khan",      phone: "9000000050" },
  ];

  const passengers = [];
  for (const p of passengerData) {
    const passenger = await prisma.passenger.upsert({
      where: { phone: p.phone },
      update: {},
      create: p,
    });
    passengers.push(passenger);
  }
  console.log(`Passengers seeded: ${passengers.length}`);
  console.log("\n Driver IDs ");
  for (const d of drivers) {
    console.log(`  ${d.name}: ${d.id}`);
  }

  console.log("\n Passenger IDs ");
  for (const p of passengers) {
    console.log(`  ${p.name}: ${p.id}`);
  }
  console.log("\n");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });