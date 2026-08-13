import { describe, expect, it } from "vitest";

describe("pré-checagem OAuth da BeautySystems", () => {
  it("alcança o endpoint de token sem iniciar uma autorização de usuário", async () => {
    const clientId = process.env.RDSTATION_BEAUTYSYSTEMS_CLIENT_ID;
    const clientSecret = process.env.RDSTATION_BEAUTYSYSTEMS_CLIENT_SECRET;

    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();

    const response = await fetch("https://api.rd.services/auth/token?token_by=code", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: "credential-preflight-no-authorization-code",
      }),
    });

    // Sem um code real, a API pode responder 400, 401 ou 422; a troca definitiva
    // é validada quando o usuário consente no fluxo OAuth e retorna ao callback.
    expect([400, 401, 422]).toContain(response.status);
  }, 15_000);
});
