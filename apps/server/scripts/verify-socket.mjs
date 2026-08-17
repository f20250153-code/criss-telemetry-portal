/**
 * Tiny manual Socket.IO client for verifying the real-time telemetry
 * stream against a running server.
 *
 * Usage:
 *   node scripts/verify-socket.mjs <jwt>
 *
 * Get a token first:
 *   curl -s -X POST http://localhost:4000/auth/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"biswajit@criss-robotics.dev","password":"Biswajit@123!"}'
 *
 * While this is running, trigger a reading in another terminal:
 *   curl -X POST http://localhost:4000/telemetry/trigger \
 *     -H "Authorization: Bearer <jwt>" -H "Content-Type: application/json" -d '{}'
 * and watch the UPDATE line appear here in real time.
 */
import { io } from "socket.io-client";

const [, , token] = process.argv;
if (!token) {
  console.error("Usage: node scripts/verify-socket.mjs <jwt>");
  process.exit(1);
}

const url = process.env.SERVER_URL ?? "http://localhost:4000";
const socket = io(url, { auth: { token }, transports: ["websocket"] });

socket.on("connect", () => console.log("CONNECTED", socket.id));
socket.on("telemetry:history", (h) => console.log("HISTORY length:", h.length));
socket.on("telemetry:update", (t) => console.log("LIVE UPDATE:", JSON.stringify(t)));
socket.on("connect_error", (e) => {
  console.log("CONNECT_ERROR:", e.message);
  process.exit(1);
});

console.log(`Listening on ${url} for 30s — trigger telemetry in another terminal to see it arrive live.`);
setTimeout(() => {
  socket.close();
  process.exit(0);
}, 30000);
