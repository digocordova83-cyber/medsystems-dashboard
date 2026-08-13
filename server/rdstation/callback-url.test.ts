import { describe, expect, it } from "vitest";

describe("URL pública de callback", () => {
  it("responde no endpoint público configurado", async () => {
    const baseUrl = process.env.RDSTATION_CALLBACK_BASE_URL;
    expect(baseUrl).toMatch(/^https:\/\//);

    const response = await fetch(`${baseUrl}/api/rdstation/callback`);
    // Sem os parâmetros code/state o callback deve rejeitar a solicitação, provando que a rota pública existe.
    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Autorização inválida");
  }, 20_000);
});
