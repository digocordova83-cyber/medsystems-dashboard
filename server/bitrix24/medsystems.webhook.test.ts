import { describe, expect, it } from "vitest";

describe("webhook Bitrix24 da Medsystems", () => {
  it("autentica no endpoint profile sem expor credenciais ou dados do perfil", async () => {
    const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
    expect(baseUrl).toBeTruthy();
    expect(baseUrl).toMatch(/^https:\/\//);

    const response = await fetch(`${baseUrl}profile.json`, { signal: AbortSignal.timeout(15_000) });
    const payload = await response.json() as { result?: unknown; error?: string };

    expect(response.ok).toBe(true);
    expect(payload.error).toBeUndefined();
    expect(payload.result).toBeTruthy();
  }, 20_000);
});
