import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

const HASH_BYTES = 64;
const LOGIN_WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 5;
const loginFailures = new Map<string, { count: number; startedAt: number }>();

export function normalizeDashboardUsername(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("pt-BR");
}

export function hashDashboardPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, HASH_BYTES);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyDashboardPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [algorithm, saltHex, hashHex] = stored.split("$");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function requestAuditMetadata(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0])?.trim()
    || req.ip
    || req.socket?.remoteAddress
    || null;
  const ipAddress = rawIp?.replace(/^::ffff:/, "").replace(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/, "$1") ?? null;
  const userAgent = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"].slice(0, 2048) : null;
  return { ipAddress, userAgent };
}

export function publicDashboardUser(user: { id: number; username?: string | null; name?: string | null; role: "admin" | "user" }) {
  return { id: user.id, username: user.username ?? null, name: user.name ?? null, role: user.role };
}

export function isDashboardLoginBlocked(key: string) {
  const entry = loginFailures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.startedAt > LOGIN_WINDOW_MS) {
    loginFailures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function registerDashboardLoginFailure(key: string) {
  const current = loginFailures.get(key);
  if (!current || Date.now() - current.startedAt > LOGIN_WINDOW_MS) {
    loginFailures.set(key, { count: 1, startedAt: Date.now() });
    return;
  }
  current.count += 1;
}

export function clearDashboardLoginFailures(key: string) {
  loginFailures.delete(key);
}
