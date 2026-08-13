import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, sha256 } from "./crypto";

describe("proteção de tokens OAuth", () => {
  it("criptografa valores de forma não determinística e os recupera com segurança", () => {
    const token = "token-sensivel-de-teste";
    const first = encryptSecret(token);
    const second = encryptSecret(token);
    expect(first).not.toBe(token);
    expect(first).not.toBe(second);
    expect(decryptSecret(first)).toBe(token);
    expect(sha256(token)).toHaveLength(64);
  });
});
