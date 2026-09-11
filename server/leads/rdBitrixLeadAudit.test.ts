import { describe, expect, it } from "vitest";
import { auditMatchStatus } from "./rdBitrixLeadAudit";

describe("auditMatchStatus", () => {
  it("identifica um lead por e-mail", () => {
    expect(auditMatchStatus({ emailMatched: true, phoneMatched: false, leadCount: 1, contactCount: 0, totalCount: 1 }))
      .toEqual({ status: "lead", method: "E-mail" });
  });

  it("mantém contato sem etapa de Lead separado", () => {
    expect(auditMatchStatus({ emailMatched: false, phoneMatched: true, leadCount: 0, contactCount: 1, totalCount: 1 }))
      .toEqual({ status: "contact_only", method: "Telefone" });
  });

  it("não cria correspondência quando as chaves estão ausentes", () => {
    expect(auditMatchStatus({ emailMatched: false, phoneMatched: false, leadCount: 0, contactCount: 0, totalCount: 0 }))
      .toEqual({ status: "not_found", method: "Sem correspondência" });
  });

  it("mantém múltiplos registros explícitos mesmo quando há Lead", () => {
    expect(auditMatchStatus({ emailMatched: true, phoneMatched: true, leadCount: 1, contactCount: 1, totalCount: 2 }))
      .toEqual({ status: "multiple", method: "E-mail + telefone" });
  });
});
