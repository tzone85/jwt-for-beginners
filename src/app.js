import express from "express";
import { JwtService } from "./services/jwt-service.js";
import { UserStore } from "./services/user-store.js";
import { requireAuth as requireAuthFactory } from "./middleware/auth.js";
import { buildAuthRouter } from "./routes/auth.js";
import { buildMeRouter } from "./routes/me.js";

/**
 * Composition root. Tests pass overrides for userStore / jwtService;
 * production wires the real implementations from config.
 */
export function createApp({ config, userStore, jwtService, logger = console } = {}) {
  const store = userStore ?? new UserStore({ rounds: config.bcryptRounds });
  const jwts = jwtService ?? new JwtService({ secret: config.jwtSecret, expiresIn: config.jwtExpiresIn });
  const requireAuth = requireAuthFactory({ jwtService: jwts, userStore: store });

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));

  app.get("/", (_req, res) => res.json({ service: "jwt-for-beginners", version: "1.0.0" }));
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/auth", buildAuthRouter({ userStore: store, jwtService: jwts }));
  app.use("/me", buildMeRouter({ requireAuth }));

  // 404
  app.use((_req, res) => res.status(404).json({ error: "not found" }));
  // central error handler
  app.use((err, _req, res, _next) => {
    logger.error("unhandled error", err);
    res.status(500).json({ error: "internal server error" });
  });

  return app;
}
