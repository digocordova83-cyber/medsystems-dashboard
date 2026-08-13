import { isRdAccountKey, type RdAccountKey } from "./types";

export function buildOAuthState(accountKey: RdAccountKey, nonce: string) {
  if (!nonce || !/^[a-zA-Z0-9_-]+$/.test(nonce)) throw new Error("Nonce OAuth inválido.");
  return `${accountKey}.${nonce}`;
}

export function parseOAuthState(state: string) {
  const [accountKey, nonce, ...rest] = state.split(".");
  if (rest.length || !accountKey || !nonce || !isRdAccountKey(accountKey) || !/^[a-zA-Z0-9_-]+$/.test(nonce)) return null;
  return { accountKey, nonce } as const;
}

export function tokenExpiryFromSeconds(expiresIn: number, now = new Date()) {
  const safeSeconds = Math.max(60, Math.floor(expiresIn) - 60);
  return new Date(now.getTime() + safeSeconds * 1000);
}
