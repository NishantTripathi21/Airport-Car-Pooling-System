import { connectQueue } from "./queues/queue.connection.js";
import { startRideWorker } from "./workers/ride.worker.js";
import { startCancellationWorker } from "./workers/cancellation.worker.js";

async function startWorkers() {
  await connectQueue();

  startRideWorker();
  startCancellationWorker();

  console.log("All workers started");
}

startWorkers().catch((err) => {
  console.error("Failed to start workers:", err);
  process.exit(1);
});