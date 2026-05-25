import { Router } from "express";
import { z } from "zod";

const credentialsSchema = z.object({
  name: z.string().trim().min(1).max(60),
  password: z.string().min(8).max(200),
});

export function buildAuthRouter({ userStore, jwtService }) {
  const router = Router();

  router.post("/register", async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "validation failed", issues: parsed.error.issues });
    }
    const result = await userStore.add(parsed.data);
    if (!result.ok) {
      return res.status(409).json({ error: result.reason });
    }
    return res.status(201).json({ user: result.user });
  });

  router.post("/login", async (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "validation failed" });
    }
    const { name, password } = parsed.data;
    // Always do the bcrypt compare even when the user is missing — guard
    // against username enumeration via response timing.
    const ok = await userStore.verifyPassword(name, password);
    if (!ok) {
      return res.status(401).json({ error: "invalid credentials" });
    }
    const user = userStore.findByName(name);
    const token = jwtService.sign({ id: user.id, name: user.name });
    return res.json({ token });
  });

  return router;
}
