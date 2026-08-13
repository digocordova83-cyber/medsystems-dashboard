import { describe, expect, it } from "vitest";

const crmMethods = ["crm.lead.list", "crm.contact.list", "crm.deal.list"] as const;

describe("permissões CRM do Bitrix24 Medsystems", () => {
  it.each(crmMethods)("permite consulta mínima de %s sem registrar dados", async method => {
    const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
    expect(baseUrl).toBeTruthy();

    const response = await fetch(`${baseUrl}${method}.json`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ select: ["ID"], start: 0 }),
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await response.json() as { result?: unknown; error?: string };

    expect(response.ok).toBe(true);
    expect(payload.error).toBeUndefined();
    expect(Array.isArray(payload.result)).toBe(true);
  }, 20_000);
});
