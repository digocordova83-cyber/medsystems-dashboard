import { describe, expect, it } from "vitest";

describe("Publya API credentials", () => {
  it("exchanges the temporary token successfully", async () => {
    const baseUrl = process.env.PUBLYA_API_BASE_URL;
    const temporaryToken = process.env.PUBLYA_TEMPORARY_TOKEN;
    const email = process.env.PUBLYA_EMAIL;
    const clientId = Number(process.env.PUBLYA_CLIENT_ID);

    expect(baseUrl).toBeTruthy();
    expect(temporaryToken).toBeTruthy();
    expect(email).toBeTruthy();
    expect(Number.isFinite(clientId)).toBe(true);

    const response = await fetch(`${baseUrl}/reports/external/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "59LUmRK1PMaNAlGHYUu9jaVCYwcqzqXe5fZZs0eL",
      },
      body: JSON.stringify({ temporaryToken, email, clientId }),
      signal: AbortSignal.timeout(20_000),
    });

    const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
    expect(response.status, JSON.stringify({ status: response.status, keys: payload ? Object.keys(payload) : [] })).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
    expect(payload && typeof payload === "object").toBeTruthy();
  }, 25_000);
});
