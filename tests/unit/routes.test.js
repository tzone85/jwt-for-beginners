import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { JwtService } from "../../src/services/jwt-service.js";
import { UserStore } from "../../src/services/user-store.js";

const silentLogger = { error() {}, warn() {}, info() {}, log() {} };

function build() {
  const store = new UserStore({ rounds: 4 });
  const jwts = new JwtService({ secret: "x".repeat(32), expiresIn: "1h" });
  const app = createApp({ userStore: store, jwtService: jwts, logger: silentLogger });
  return { app, store, jwts };
}

describe("GET /", () => {
  it("returns service banner", async () => {
    const { app } = build();
    const r = await request(app).get("/");
    expect(r.status).toBe(200);
    expect(r.body.service).toBe("jwt-for-beginners");
  });
});

describe("GET /health", () => {
  it("returns ok", async () => {
    const { app } = build();
    const r = await request(app).get("/health");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ status: "ok" });
  });
});

describe("POST /auth/register", () => {
  it("creates a user and returns the public projection", async () => {
    const { app } = build();
    const r = await request(app)
      .post("/auth/register")
      .send({ name: "alice", password: "correct-horse" });
    expect(r.status).toBe(201);
    expect(r.body.user).toEqual({ id: 1, name: "alice" });
    expect(r.body.user).not.toHaveProperty("password");
    expect(r.body.user).not.toHaveProperty("passwordHash");
  });

  it("rejects invalid body", async () => {
    const { app } = build();
    const r = await request(app).post("/auth/register").send({ name: "x", password: "short" });
    expect(r.status).toBe(400);
  });

  it("rejects duplicate name", async () => {
    const { app, store } = build();
    await store.add({ name: "alice", password: "correct-horse" });
    const r = await request(app)
      .post("/auth/register")
      .send({ name: "alice", password: "correct-horse" });
    expect(r.status).toBe(409);
  });
});

describe("POST /auth/login", () => {
  it("returns a token on correct credentials", async () => {
    const { app, store } = build();
    await store.add({ name: "alice", password: "correct-horse" });
    const r = await request(app)
      .post("/auth/login")
      .send({ name: "alice", password: "correct-horse" });
    expect(r.status).toBe(200);
    expect(typeof r.body.token).toBe("string");
    expect(r.body.token.split(".")).toHaveLength(3);
  });

  it("401 on unknown user (REGRESSION: original threw TypeError because it didn't return after 401)", async () => {
    const { app } = build();
    const r = await request(app).post("/auth/login").send({ name: "nobody", password: "12345678" });
    expect(r.status).toBe(401);
    expect(r.body.error).toMatch(/invalid credentials/);
  });

  it("401 on wrong password", async () => {
    const { app, store } = build();
    await store.add({ name: "alice", password: "correct-horse" });
    const r = await request(app)
      .post("/auth/login")
      .send({ name: "alice", password: "wrong-password" });
    expect(r.status).toBe(401);
  });

  it("400 on malformed body", async () => {
    const { app } = build();
    const r = await request(app).post("/auth/login").send({});
    expect(r.status).toBe(400);
  });
});

describe("GET /me", () => {
  it("returns the user when token is valid (REGRESSION: original's findIndex bug made /me always 401)", async () => {
    const { app, store, jwts } = build();
    await store.add({ name: "alice", password: "correct-horse" });
    const token = jwts.sign({ id: 1, name: "alice" });
    const r = await request(app).get("/me").set("Authorization", `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(r.body.user).toEqual({ id: 1, name: "alice" });
  });

  it("401 with no Authorization header", async () => {
    const { app } = build();
    const r = await request(app).get("/me");
    expect(r.status).toBe(401);
    expect(r.body.error).toMatch(/missing/);
  });

  it("401 with a tampered token", async () => {
    const { app } = build();
    const r = await request(app).get("/me").set("Authorization", "Bearer not.a.real.jwt");
    expect(r.status).toBe(401);
    expect(r.body.error).toMatch(/invalid/);
  });

  it("401 when the signing user is gone", async () => {
    const { app, jwts } = build();
    const token = jwts.sign({ id: 99, name: "ghost" });
    const r = await request(app).get("/me").set("Authorization", `Bearer ${token}`);
    expect(r.status).toBe(401);
    expect(r.body.error).toMatch(/no longer/);
  });
});

describe("404", () => {
  it("returns JSON 404 for unknown routes", async () => {
    const { app } = build();
    const r = await request(app).get("/unknown");
    expect(r.status).toBe(404);
    expect(r.body).toEqual({ error: "not found" });
  });
});
