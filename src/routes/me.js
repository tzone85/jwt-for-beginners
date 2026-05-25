import { Router } from "express";

export function buildMeRouter({ requireAuth }) {
  const router = Router();
  router.get("/", requireAuth, (req, res) => res.json({ user: req.user }));
  return router;
}
