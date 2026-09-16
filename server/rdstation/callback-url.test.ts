import { describe, expect, it } from "vitest";

describe("URL pública de callback", () => {
  it("usa uma origem HTTPS pública configurada", () => {
    const baseUrl = process.env.RDSTATION_CALLBACK_BASE_URL;
    expect(baseUrl).toMatch(/^https:\/\//);
    expect(baseUrl).not.toContain("localhost");
    expect(new URL(baseUrl!).pathname).toBe("/");
  });
});
