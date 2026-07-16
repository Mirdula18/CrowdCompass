import app from "./app.js";
import { stopLiveDataGenerator } from "./live-data.js";

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`StadiumPilot server running on port ${PORT}`);
});

// Render (like most hosts) sends SIGTERM on every deploy/restart — stop taking
// new connections and let in-flight requests finish instead of cutting them
// off mid-response.
function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully`);
  stopLiveDataGenerator();
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
