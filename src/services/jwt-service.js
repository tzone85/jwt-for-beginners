import jwt from "jsonwebtoken";

/**
 * Wraps jsonwebtoken with the app's config — never let route code touch the
 * secret directly.
 */
export class JwtService {
  #secret; #expiresIn;
  constructor({ secret, expiresIn }) {
    if (!secret) throw new Error("JwtService requires a secret");
    this.#secret = secret;
    this.#expiresIn = expiresIn ?? "1h";
  }

  sign(payload) {
    return jwt.sign(payload, this.#secret, { expiresIn: this.#expiresIn });
  }

  verify(token) {
    try {
      return { ok: true, payload: jwt.verify(token, this.#secret) };
    } catch (err) {
      return { ok: false, error: err.name === "TokenExpiredError" ? "expired" : "invalid" };
    }
  }
}
