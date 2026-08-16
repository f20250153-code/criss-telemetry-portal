import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";

const app = createApp();

const VIEWER = { email: "viewer@criss-robotics.dev", password: "ViewerDev123!" };
const ENGINEER = { email: "engineer@criss-robotics.dev", password: "EngineerDev123!" };

async function tokenFor(creds: { email: string; password: string }): Promise<string> {
  const res = await request(app).post("/auth/login").send(creds);
  return res.body.data.token as string;
}

describe("GET /telemetry/history", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app).get("/telemetry/history");
    expect(res.status).toBe(401);
  });

  it("returns an array for any authenticated role", async () => {
    const token = await tokenFor(VIEWER);
    const res = await request(app).get("/telemetry/history").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("POST /telemetry/trigger", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app).post("/telemetry/trigger").send({});
    expect(res.status).toBe(401);
  });

  it("rejects a viewer with 403", async () => {
    const token = await tokenFor(VIEWER);
    const res = await request(app)
      .post("/telemetry/trigger")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("allows an engineer and returns a valid reading", async () => {
    const token = await tokenFor(ENGINEER);
    const res = await request(app)
      .post("/telemetry/trigger")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      batteryVoltage: expect.any(Number),
      temperature: expect.any(Number),
      state: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  it("clamps an out-of-range manual value instead of trusting it blindly", async () => {
    const token = await tokenFor(ENGINEER);
    const res = await request(app)
      .post("/telemetry/trigger")
      .set("Authorization", `Bearer ${token}`)
      .send({ batteryVoltage: 9999 });

    // Rejected by zod (out of TELEMETRY_BOUNDS) before it ever reaches
    // the service — proves manual input is validated, not trusted.
    expect(res.status).toBe(400);
  });

  it("accepts a valid manual override and uses it", async () => {
    const token = await tokenFor(ENGINEER);
    const res = await request(app)
      .post("/telemetry/trigger")
      .set("Authorization", `Bearer ${token}`)
      .send({ batteryVoltage: 12.5, state: "FAULT" });

    expect(res.status).toBe(201);
    expect(res.body.data.batteryVoltage).toBe(12.5);
    expect(res.body.data.state).toBe("FAULT");
  });
});
