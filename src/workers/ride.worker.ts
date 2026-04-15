import { getChannel, QUEUES } from "../queues/queue.connection.js";
import { processRide } from "../services/pooling.service.js";


export function startRideWorker() {
  const channel = getChannel();
  channel.prefetch(1);

  channel.consume(QUEUES.RIDE_REQUESTED, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      const { rideId } = payload;

      console.log(`[ride.worker] Processing ride: ${rideId}`);

      await processRide(rideId);
      channel.ack(msg);

      console.log(`[ride.worker] Done: ${rideId}`);
    } catch (err) {
      console.error("[ride.worker] Error:", err);
      channel.nack(msg, false, true);
    }
  });

  console.log("[ride.worker] Listening on", QUEUES.RIDE_REQUESTED);
}