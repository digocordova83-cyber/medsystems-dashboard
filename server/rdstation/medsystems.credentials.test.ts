import { describe, expect, it } from "vitest";

describe("pré-checagem OAuth da Medsystems", () => {
  it("alcança o endpoint de token sem tentar validar credenciais antes de existir um code real", async () => {
    const clientId = process.env.RDSTATION_MEDSYSTEMS_CLIENT_ID;
    const clientSecret = process.env.RDSTATION_MEDSYSTEMS_CLIENT_SECRET;

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

    // Sem um code real, o RD Station pode devolver 400, 401 ou 422. A confirmação do par
    // client_id/client_secret ocorre no callback após a autorização consentida pelo usuário.
    expect([400, 401, 422]).toContain(response.status);
  }, 15_000);
});
