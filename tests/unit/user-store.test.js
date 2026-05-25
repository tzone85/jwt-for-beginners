import { describe, expect, it } from "vitest";
import { UserStore } from "../../src/services/user-store.js";

const opts = { rounds: 4 }; // fast bcrypt for tests

describe("UserStore", () => {
  it("hashes the password on add (never stored plaintext)", async () => {
    const s = new UserStore(opts);
    const r = await s.add({ name: "alice", password: "correct-horse" });
    expect(r.ok).toBe(true);
    // public projection has no passwordHash
    expect(r.user).not.toHaveProperty("passwordHash");
    expect(r.user).not.toHaveProperty("password");
    // private record is hashed
    const internal = s.findByName("alice");
    expect(internal.passwordHash).not.toBe("correct-horse");
    expect(internal.passwordHash.startsWith("$2")).toBe(true);
  });

  it("rejects duplicates", async () => {
    const s = new UserStore(opts);
    await s.add({ name: "a", password: "12345678" });
    const r = await s.add({ name: "a", password: "12345678" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/already/);
  });

  it("rejects short passwords (< 8 chars)", async () => {
    const s = new UserStore(opts);
    const r = await s.add({ name: "a", password: "short" });
    expect(r.ok).toBe(false);
  });

  it("verifyPassword returns true only on a correct match", async () => {
    const s = new UserStore(opts);
    await s.add({ name: "alice", password: "correct-horse" });
    expect(await s.verifyPassword("alice", "correct-horse")).toBe(true);
    expect(await s.verifyPassword("alice", "wrong")).toBe(false);
    expect(await s.verifyPassword("nobody", "anything")).toBe(false);
  });

  it("findById returns the public projection", async () => {
    const s = new UserStore(opts);
    await s.add({ name: "alice", password: "12345678" });
    const u = s.findById(1);
    expect(u).toEqual({ id: 1, name: "alice" });
  });
});
