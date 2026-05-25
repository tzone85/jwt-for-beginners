/**
 * Bearer-token middleware. Attaches `req.user = {id, name}` on success or
 * responds 401 on failure.
 */
export function requireAuth({ jwtService, userStore }) {
  return (req, res, next) => {
    const header = req.headers.authorization ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) {
      return res.status(401).json({ error: "missing or malformed Authorization header" });
    }
    const result = jwtService.verify(match[1]);
    if (!result.ok) {
      return res.status(401).json({ error: `token ${result.error}` });
    }
    const user = userStore.findById(result.payload.id);
    if (!user) {
      return res.status(401).json({ error: "user no longer exists" });
    }
    req.user = user;
    next();
  };
}
