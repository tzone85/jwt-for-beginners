import { describe, expect, it } from "vitest";
import { JwtService } from "../../src/services/jwt-service.js";

describe("JwtService", () => {
  it("signs + verifies a roundtrip", () => {
    const s = new JwtService({ secret: "x".repeat(32) });
    const token = s.sign({ id: 7, name: "alice" });
    const r = s.verify(token);
    expect(r.ok).toBe(true);
    expect(r.payload.id).toBe(7);
  });

  it("rejects tokens signed with a different secret", () => {
    const a = new JwtService({ secret: "x".repeat(32) });
    const b = new JwtService({ secret: "y".repeat(32) });
    const token = a.sign({ id: 1 });
    expect(b.verify(token).ok).toBe(false);
  });

  it("reports expiry distinctly", async () => {
    const s = new JwtService({ secret: "x".repeat(32), expiresIn: "1s" });
    const token = s.sign({ id: 1 });
    await new Promise((r) => setTimeout(r, 1100));
    const r = s.verify(token);
    expect(r.ok).toBe(false);
    expect(r.error).toBe("expired");
  });

  it("constructor throws without a secret", () => {
    expect(() => new JwtService({})).toThrow();
  });
});
