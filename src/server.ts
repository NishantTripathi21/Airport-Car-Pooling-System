import app from "./app.js";
import { connectQueue } from "./queues/queue.connection.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectQueue();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});