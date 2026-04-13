import { getChannel, QUEUES } from "./queue.connection.js";

export interface RideRequestedEvent {
  rideId: string;
}

export interface RideCancelledEvent {
  rideId: string;
  poolId: string;
}

// Called by ride controller after saving a new ride to DB.
// Worker picks this up and runs the pooling algorithm.
export function publishRideRequested(payload: RideRequestedEvent): void {
  const channel = getChannel();

  channel.sendToQueue(
    QUEUES.RIDE_REQUESTED,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
}

export function publishRideCancelled(payload: RideCancelledEvent): void {
  const channel = getChannel();

  channel.sendToQueue(
    QUEUES.RIDE_CANCELLED,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
}