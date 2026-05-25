import bcrypt from "bcrypt";

/**
 * In-memory user store. Production would be a real database; the contract
 * (findByName + verifyPassword + add) is stable enough that the swap is local.
 *
 * Passwords are bcrypt-hashed on add; never stored plaintext.
 */
export class UserStore {
  #users = new Map(); // name -> { id, name, passwordHash }
  #nextId = 1;
  #rounds;

  constructor({ rounds = 12 } = {}) {
    this.#rounds = rounds;
  }

  async add({ name, password }) {
    if (!name || typeof name !== "string") {
      return { ok: false, reason: "name is required" };
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return { ok: false, reason: "password must be at least 8 characters" };
    }
    if (this.#users.has(name)) {
      return { ok: false, reason: "user already exists" };
    }
    const passwordHash = await bcrypt.hash(password, this.#rounds);
    const user = { id: this.#nextId++, name, passwordHash };
    this.#users.set(name, user);
    return { ok: true, user: this._public(user) };
  }

  findByName(name) {
    return this.#users.get(name) ?? null;
  }

  findById(id) {
    for (const u of this.#users.values()) if (u.id === id) return this._public(u);
    return null;
  }

  async verifyPassword(name, password) {
    const u = this.#users.get(name);
    if (!u) return false;
    return bcrypt.compare(password, u.passwordHash);
  }

  _public(u) {
    return { id: u.id, name: u.name };
  }
}
