import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter } from "k6/metrics";


const matchLatency = new Trend("match_latency_ms", true); 
const matchedRides = new Counter("matched_rides");
const unmatchedRides = new Counter("unmatched_rides");

export let options = {
  scenarios: {
    latency_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 10 },
        { duration: "20s", target: 10 },
        { duration: "5s",  target: 0  },
      ],
      gracefulRampDown: "5s",
      tags: { scenario: "latency" },
    },
    concurrency_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "5s",  target: 50 },
        { duration: "20s", target: 50 },
        { duration: "5s",  target: 0  },
      ],
      startTime: "40s", 
      gracefulRampDown: "5s",
      tags: { scenario: "concurrency" },
    },
  },

  thresholds: {
    "http_req_duration{name:book_ride}": ["p(95)<500"],
    "match_latency_ms": ["p(90)<3000"],
    "http_req_failed": ["rate<0.01"],
  },
};

const passengerIds = [
  "de7168af-f05b-41c8-a551-aa55e177985c", // Ananya Sharma
  "aeecf9c6-11e1-484a-94a0-5a56278086c9", // Rohan Mehta
  "78154e22-2981-4c71-a963-1812783252b6", // Priya Nair
  "a55d679e-0eb9-4302-a9d7-9bf9677c0f3a", // Karan Verma
  "a136f0b6-3f46-4752-9d13-8d91f82ba1e6", // Sneha Iyer
  "218dc861-1fff-45c9-b68d-45d3cb372976", // Arjun Patel
  "be84e37a-21dc-4d84-afcd-19ac97400908", // Divya Reddy
  "cf7f3169-7b2e-4177-9a04-9c0e940e4ad0", // Rahul Das
  "82583921-75c5-440b-99fd-1024017e5a65", // Pooja Singh
  "7977323a-ffd6-4c17-9a3e-a58fbcac6f36", // Vikash Kumar
  "3a1062fc-4926-48e5-86bd-6088308b7f1b", // Neha Kapoor
  "a73296df-a6e9-4cb9-8a63-0f999ce63b00", // Aditya Roy
  "53ec3f2e-052c-4dbb-8619-c5253f4a8518", // Meera Joshi
  "19fa114b-e686-4ef5-84ec-318672e28f56", // Sunil Gupta
  "33598b3b-cf5e-4c7f-9f0b-e9e0bc4cffac", // Kavya Nair
  "eca0dff4-d055-4454-8092-e440ecf9c239", // Alok Nath
  "98b6fc6f-94e2-4b99-90b8-26186c900421", // Ritika Singh
  "f5f5dd23-8f87-4082-9d99-56d7c738a309", // Yash Verma
  "21e07568-4c13-425b-97e3-7d47d348bb52", // Tanvi Shah
  "8efdf9bf-dcd3-4401-9e08-881b9e1d0e3d", // Mohit Jain
  "3bbdae39-963c-44aa-a44e-35fee899a3b1", // Sanya Khanna
  "a63b9c9d-d057-49e6-92b5-149d5e517929", // Ravi Teja
  "13abdcff-367d-487f-9000-3ca6e16ba743", // Ishaan Malhotra
  "8292fdee-6437-47c2-87b0-1af809ee1d01", // Puja Agarwal
  "17946226-b4c8-4e56-8e4a-97f5fe09a992", // Nikhil Bose
  "507b7b4e-5b30-409a-abf9-13d04f92be7f", // Shruti Pandey
  "3228c7bf-f263-41ea-b4ca-2c00894786a7", // Abhishek Rao
  "a00db891-a18f-481d-a0a6-01ef7a4be472", // Ankita Mishra
  "3516cff9-2797-4de3-af45-bac186d50730", // Harsh Sinha
  "7e6cf2b6-9f07-464a-9a4a-cce7bb7c438a", // Simran Kaur
  "6f4e7e5d-fee3-437d-b1a6-1bdc75f56a86", // Varun Dhawan
  "377fe3e3-d9d4-49d2-8b93-2993b561fe7c", // Naina Saxena
  "368e371c-1666-4a7c-9a2d-6d4038027b36", // Rohit Sharma
  "89254040-3eba-4811-95a2-9ede35217a76", // Pallavi Menon
  "bbd5051d-308f-45d3-ac88-7e7d52ea07ee", // Aman Bajaj
  "e2689da2-0031-40e1-8108-ac1fcb0a2f62", // Kritika Sethi
  "5f07e59a-51e9-4767-90b9-0b47f3a6b419", // Gaurav Chopra
  "ecbcdf30-8142-4f2f-934d-e281dd44809a", // Tanya Bhatt
  "37e49da5-2b7c-47df-afc3-97f6776ade20", // Manish Trivedi
  "0eb4403e-62c5-471f-bce8-7f7b7d81574d", // Sonal Desai
  "887f316a-76ef-4244-a050-008f79fb06f7", // Kunal Ahuja
  "67956d1f-17b3-4ed9-86a8-b74cf1f4f54c", // Richa Srivastava
  "43825c7a-008d-4456-8cd8-e3880748811e", // Parth Oberoi
  "265475d5-44ec-4ad5-b0f5-b49cec8ee189", // Disha Thakur
  "a4a701f2-d430-40d6-aff9-c4ce1bb02c2e", // Ayush Bansal
  "ce895ccf-6d10-4d4b-84f0-d246ee63525e", // Nidhi Choudhary
  "cf3ec9be-ac21-44f2-b9e6-caa712f41be8", // Siddharth Gill
  "a23d188f-94bf-4379-a1b1-d196d028839f", // Bhavna Mathur
  "ffe64597-2054-4a96-8d98-6603ce01f3ff", // Kartik Arora
  "f83f4f2b-667b-484b-a302-380ba05dccd0", // Zara Khan
];

const dropoffs = [
  { lat: 30.7410, lng: 76.7849 }, // Sector 17
  { lat: 30.7333, lng: 76.7794 }, // Sector 22
  { lat: 30.7500, lng: 76.7900 }, // Sector 8
  { lat: 30.7192, lng: 76.8108 }, // Sector 35
  { lat: 30.7650, lng: 76.7650 }, // Sector 7
  { lat: 30.7280, lng: 76.7950 }, // Sector 26
  { lat: 30.7550, lng: 76.8100 }, // Sector 4
  { lat: 30.7100, lng: 76.7800 }, // Sector 40
  { lat: 30.7450, lng: 76.7700 }, // Sector 15
  { lat: 30.7380, lng: 76.8050 }, // Sector 20
];

const BASE_URL = "http://localhost:3000";

export default function () {
  const vuIndex = (__VU - 1) % passengerIds.length;
  const passengerId = passengerIds[vuIndex];
  const dropoff = dropoffs[__VU % dropoffs.length];

  const bookStart = Date.now();

  const bookRes = http.post(
    `${BASE_URL}/rides/request`,
    JSON.stringify({
      passengerId,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      seatsNeeded: 1,
      luggageCount: 0,
      maxDetourPct: 40,
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { name: "book_ride" },
    }
  );

  check(bookRes, {
    "book: status 202": (r) => r.status === 202,
    "book: has rideId": (r) => {
      try { return JSON.parse(r.body).rideId !== undefined; }
      catch { return false; }
    },
  });

  if (bookRes.status !== 202) return;

  const rideId = JSON.parse(bookRes.body).rideId;

  let matched = false;

  for (let attempt = 0; attempt < 10; attempt++) {
    sleep(3);

    const statusRes = http.get(`${BASE_URL}/rides/${rideId}/status`, {
      tags: { name: "poll_status" },
    });

    check(statusRes, {
      "poll: status 200": (r) => r.status === 200,
    });

    if (statusRes.status !== 200) continue;

    let body;
    try { body = JSON.parse(statusRes.body); }
    catch { continue; }

    if (body.status === "matched") {
      const elapsed = Date.now() - bookStart;
      matchLatency.add(elapsed);
      matchedRides.add(1);

      check(body, {
        "matched: fare > 0":     (b) => b.fare > 0,
        "matched: dropOrder >= 1":(b) => b.dropOrder >= 1,
        "matched: has driver":   (b) => b.driver !== null,
        "matched: poolSize >= 1":(b) => b.poolSize >= 1,
      });

      matched = true;
      break;
    }
  }

  if (!matched) {
    unmatchedRides.add(1);
  }
}