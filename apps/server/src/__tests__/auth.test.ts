import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";

const app = createApp();

const VIEWER = { email: "vineet@criss-robotics.dev", password: "Vineet@123!" };
const ENGINEER = { email: "biswajit@criss-robotics.dev", password: "Biswajit@123!" };

describe("POST /auth/login", () => {
  it("returns a token and public user on valid credentials", async () => {
    const res = await request(app).post("/auth/login").send(VIEWER);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({
      email: VIEWER.email,
      role: "VIEWER",
    });
    // Never leak password/hash to the client.
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects an invalid password with 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: VIEWER.email, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects an unknown email with 401 (same message as wrong password)", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@nowhere.dev", password: "irrelevant" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects malformed input with 400", async () => {
    const res = await request(app).post("/auth/login").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("applies rate-limit headers to protect against brute-force guessing", async () => {
    const res = await request(app).post("/auth/login").send(VIEWER);
    expect(res.headers["ratelimit-limit"]).toBeDefined();
    expect(res.headers["ratelimit-remaining"]).toBeDefined();
  });
});

describe("Protected routes", () => {
  it("rejects a request with no token with 401", async () => {
    const res = await request(app).get("/example/dashboard-ping");
    expect(res.status).toBe(401);
  });

  it("rejects a request with a garbage token with 401", async () => {
    const res = await request(app)
      .get("/example/dashboard-ping")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("allows any authenticated role on a general protected route", async () => {
    const loginRes = await request(app).post("/auth/login").send(VIEWER);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get("/example/dashboard-ping")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("rejects a viewer on an engineer-only route with 403", async () => {
    const loginRes = await request(app).post("/auth/login").send(VIEWER);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get("/example/engineer-ping")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("allows an engineer on an engineer-only route with 200", async () => {
    const loginRes = await request(app).post("/auth/login").send(ENGINEER);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get("/example/engineer-ping")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("ignores a client-supplied role claim — role always comes from the verified JWT", async () => {
    // A viewer's token is genuinely a viewer's token. Nothing the
    // client sends alongside it (body field, header, query param) can
    // elevate the request, because requireRole only ever reads
    // req.user.role, which was set from the token signature in the
    // authenticate middleware — never from anything else on the request.
    const loginRes = await request(app).post("/auth/login").send(VIEWER);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .get("/example/engineer-ping")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Role", "ENGINEER")
      .send({ role: "ENGINEER" });

    expect(res.status).toBe(403);
  });

  it("rejects a request with a role claim that doesn't match a real elevated user (token integrity)", async () => {
    // A token can only be forged if you know the JWT secret — this
    // proves the server derives role from the verified signature, not
    // from anything a client could tamper with client-side.
    const res = await request(app)
      .get("/example/engineer-ping")
      .set("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4Iiwicm9sZSI6IkVOR0lORUVSIn0.invalid");
    expect(res.status).toBe(401);
  });
});
