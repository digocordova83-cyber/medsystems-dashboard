import { describe, expect, it } from "vitest";
import { auditMatchStatus, bitrixAuditCandidate } from "./rdBitrixLeadAudit";
import { resolveRdBitrixLeadMatch } from "../bitrix24/rdOpportunityAnalytics";

describe("auditMatchStatus", () => {
  it("identifica um lead por e-mail", () => {
    expect(auditMatchStatus({ emailMatched: true, nameMatched: false, leadCount: 1, contactCount: 0, totalCount: 1 }))
      .toEqual({ status: "lead", method: "E-mail" });
  });

  it("mantém contato encontrado por nome sem etapa de Lead separado", () => {
    expect(auditMatchStatus({ emailMatched: false, nameMatched: true, leadCount: 0, contactCount: 1, totalCount: 1 }))
      .toEqual({ status: "contact_only", method: "Nome" });
  });

  it("não cria correspondência quando as chaves estão ausentes", () => {
    expect(auditMatchStatus({ emailMatched: false, nameMatched: false, leadCount: 0, contactCount: 0, totalCount: 0 }))
      .toEqual({ status: "not_found", method: "Sem correspondência" });
  });

  it("mantém múltiplos registros explícitos mesmo quando há Lead", () => {
    expect(auditMatchStatus({ emailMatched: true, nameMatched: true, leadCount: 1, contactCount: 1, totalCount: 2 }))
      .toEqual({ status: "multiple", method: "E-mail + nome" });
  });

  it("prioriza e-mail exato antes do nome", () => {
    const emailCandidate = { bitrixId: 1, entityType: "lead" as const, fullName: "Nome diferente", email: "email@exemplo.com", phone: null, stageOrStatus: "NEW", createdAtBitrix: new Date(), rawPayload: "{}" };
    const nameCandidate = { bitrixId: 2, entityType: "lead" as const, fullName: "Ana Silva", email: null, phone: null, stageOrStatus: "NEW", createdAtBitrix: new Date(), rawPayload: "{}" };
    expect(resolveRdBitrixLeadMatch({
      rdEmail: "email@exemplo.com",
      rdName: "Ana Silva",
      byEmail: new Map([["email@exemplo.com", [emailCandidate]]]),
      byName: new Map([["ana silva", [nameCandidate]]]),
    })).toMatchObject({ status: "matched", method: "E-mail", candidate: { bitrixId: 1 } });
  });

  it("mantém nome com mais de um registro fora do funil", () => {
    const candidate = (bitrixId: number) => ({ bitrixId, entityType: "lead" as const, fullName: "Ana Silva", email: null, phone: null, stageOrStatus: "NEW", createdAtBitrix: new Date(), rawPayload: "{}" });
    expect(resolveRdBitrixLeadMatch({
      rdEmail: null,
      rdName: "Ana Silva",
      byEmail: new Map(),
      byName: new Map([["ana silva", [candidate(1), candidate(2)]]]),
    })).toMatchObject({ status: "multiple", candidate: null });
  });

  it("expõe os dados de revisão de cada candidato Bitrix sem transformar contato em etapa de Lead", () => {
    const candidate = bitrixAuditCandidate({
      bitrixId: 42,
      entityType: "contact",
      fullName: "Ana Silva",
      email: "ana@exemplo.com",
      phone: "+5511999999999",
      stageOrStatus: null,
      createdAtBitrix: new Date("2026-09-10T14:00:00.000Z"),
      rawPayload: "{}",
    });
    expect(candidate).toMatchObject({
      entityType: "contact",
      bitrixId: 42,
      name: "Ana Silva",
      email: "ana@exemplo.com",
      phone: "+5511999999999",
      stage: "Contato sem etapa de Lead",
      createdAt: "2026-09-10",
    });
  });
});
