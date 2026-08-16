import { createServer } from "http";
import { createApp } from "./app";
import { createSocketServer } from "./realtime/socket";
import { env } from "./config/env";

const app = createApp();
const httpServer = createServer(app);
const io = createSocketServer(httpServer);

// Lets REST route handlers (e.g. the telemetry trigger endpoint)
// broadcast over the same Socket.IO instance the HTTP server owns.
app.locals.io = io;

httpServer.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on port ${env.port} (${env.nodeEnv})`);
});
