import { describe, expect, it } from "vitest";
import { buildOAuthState, parseOAuthState, tokenExpiryFromSeconds } from "./oauth";

describe("estado e validade OAuth", () => {
  it("mantém o estado OAuth isolado por conta", () => {
    expect(buildOAuthState("medsystems", "nonceMed123")).toBe("medsystems.nonceMed123");
    expect(buildOAuthState("beautysystems", "nonceBeauty456")).toBe("beautysystems.nonceBeauty456");
    expect(parseOAuthState("medsystems.nonceMed123")).toEqual({ accountKey: "medsystems", nonce: "nonceMed123" });
    expect(parseOAuthState("outra.nonce")).toBeNull();
    expect(parseOAuthState("medsystems.nonce.extra")).toBeNull();
  });

  it("antecipa a renovação do token e preserva uma janela mínima segura", () => {
    const now = new Date("2026-07-01T12:00:00.000Z");
    expect(tokenExpiryFromSeconds(3600, now).toISOString()).toBe("2026-07-01T12:59:00.000Z");
    expect(tokenExpiryFromSeconds(30, now).toISOString()).toBe("2026-07-01T12:01:00.000Z");
  });
});
