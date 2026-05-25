import { z } from "zod";

export class ConfigError extends Error {
  constructor(message, issues) {
    super(message);
    this.name = "ConfigError";
    this.issues = issues;
  }
}

const schema = z.object({
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  PORT: z.string().regex(/^\d+$/).optional(),
  BCRYPT_ROUNDS: z.string().regex(/^\d+$/).optional(),
});

export function loadConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigError("invalid environment", parsed.error.issues);
  }
  return Object.freeze({
    jwtSecret: parsed.data.JWT_SECRET,
    jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
    port: parsed.data.PORT ? Number(parsed.data.PORT) : 3000,
    bcryptRounds: parsed.data.BCRYPT_ROUNDS ? Number(parsed.data.BCRYPT_ROUNDS) : 12,
  });
}
