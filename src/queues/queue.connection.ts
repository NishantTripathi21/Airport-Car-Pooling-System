import amqp from "amqplib";

export const QUEUES = {
  RIDE_REQUESTED: "ride.requested",
  RIDE_CANCELLED: "ride.cancelled",
};


let channel: amqp.Channel | null = null;

export async function connectQueue(): Promise<void> {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || "amqp://localhost:5672"
  );

  channel = await connection.createChannel();
  await channel.assertQueue(QUEUES.RIDE_REQUESTED, { durable: true });
  await channel.assertQueue(QUEUES.RIDE_CANCELLED, { durable: true });

  console.log("RabbitMQ connected");
}

export function getChannel(): amqp.Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized. Call connectQueue() first.");
  }
  return channel;
}