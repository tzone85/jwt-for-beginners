import { describe, expect, it } from "vitest";
import { loadConfig, ConfigError } from "../../src/config.js";

describe("loadConfig", () => {
  it("returns parsed config when all required vars are present", () => {
    const cfg = loadConfig({ JWT_SECRET: "x".repeat(32) });
    expect(cfg.jwtSecret.length).toBe(32);
    expect(cfg.jwtExpiresIn).toBe("1h");
    expect(cfg.port).toBe(3000);
    expect(cfg.bcryptRounds).toBe(12);
  });

  it("respects PORT, BCRYPT_ROUNDS, JWT_EXPIRES_IN overrides", () => {
    const cfg = loadConfig({
      JWT_SECRET: "x".repeat(32),
      PORT: "4242",
      BCRYPT_ROUNDS: "8",
      JWT_EXPIRES_IN: "15m",
    });
    expect(cfg.port).toBe(4242);
    expect(cfg.bcryptRounds).toBe(8);
    expect(cfg.jwtExpiresIn).toBe("15m");
  });

  it("rejects missing or short JWT_SECRET", () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
    expect(() => loadConfig({ JWT_SECRET: "short" })).toThrow(ConfigError);
  });
});
