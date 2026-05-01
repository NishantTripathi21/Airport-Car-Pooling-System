const BASE_URL = "http://localhost:3000";

const driverIds = [
  "b9fc65a7-2630-416a-9a33-bdf92db9369e", // Rajesh Kumar
  "f4bac8bc-65e5-4ce2-b735-9e59f97677cd", // Amit Singh
  "a4c7ac7f-2edb-4f6b-9392-bbc8a3b9f327", // Suresh Sharma
  "05cd272d-4cd5-4de6-b35e-de66863cddcc", // Vikram Nair
  "30ef49c8-93e4-4f60-8839-d88ae0d727b0", // Deepak Mehta
  "768b657e-f319-465a-8894-4297b6e2d491", // Arun Verma
  "c6d3767f-fb8e-4fe0-92be-d22d6c92687a", // Sanjay Das
  "9d8919a9-681b-4782-b39b-c1c5ce52e11a", // Kiran Patel
  "e9176205-dcfc-4f7c-b719-fe50f581112b", // Manoj Reddy
  "84dffbc6-a2df-4596-9c1d-bea2f8aeb08e", // Nitin Joshi
];

async function main() {
  console.log("Putting all drivers on duty...");

  for (const driverId of driverIds) {
    const res = await fetch(`${BASE_URL}/drivers/duty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId }),
    });
    const data = await res.json();
    console.log(`  ${driverId}: ${JSON.stringify(data)}`);
  }

  console.log("All drivers on duty.");
}

main().catch(console.error);