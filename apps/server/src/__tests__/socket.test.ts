import { createServer } from "http";
import type { AddressInfo } from "net";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { io as ioClient, type Socket } from "socket.io-client";
import { createApp } from "../app";
import { createSocketServer } from "../realtime/socket";
import { SOCKET_EVENTS } from "@telemetry/shared";

const ENGINEER = { email: "engineer@criss-robotics.dev", password: "EngineerDev123!" };

describe("Socket.IO telemetry stream", () => {
  const app = createApp();
  const httpServer = createServer(app);
  createSocketServer(httpServer);
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const { port } = httpServer.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    httpServer.close();
  });

  function connect(token?: string): Socket {
    return ioClient(baseUrl, {
      auth: token ? { token } : {},
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
    });
  }

  it("rejects a connection with no token", async () => {
    const socket = connect();
    const error = await new Promise<Error>((resolve) => {
      socket.on("connect_error", resolve);
    });
    expect(error.message).toBe("UNAUTHORIZED");
    socket.close();
  });

  it("rejects a connection with an invalid token", async () => {
    const socket = connect("not-a-real-token");
    const error = await new Promise<Error>((resolve) => {
      socket.on("connect_error", resolve);
    });
    expect(error.message).toBe("UNAUTHORIZED");
    socket.close();
  });

  it("accepts a valid token and receives telemetry history on connect", async () => {
    const loginRes = await request(app).post("/auth/login").send(ENGINEER);
    const token = loginRes.body.data.token as string;

    const socket = connect(token);
    const history = await new Promise<unknown[]>((resolve, reject) => {
      socket.on(SOCKET_EVENTS.TELEMETRY_HISTORY, resolve);
      socket.on("connect_error", reject);
    });

    expect(Array.isArray(history)).toBe(true);
    socket.close();
  });
});
