import { describe, expect, it } from "vitest";
import { classifySource, isImportationEvent, qualifiesDirectApiEvent } from "./filtering";

describe("normalização de filtros da API direta", () => {
  it("classifica mídia paga, origem desconhecida e outros canais", () => {
    expect(classifySource("utm_source=google&utm_medium=cpc&utm_campaign=teste")).toBe("midia_paga");
    expect(classifySource("(none)")).toBe("desconhecido");
    expect(classifySource("utm_source=newsletter&utm_medium=email")).toBe("outros_canais");
  });

  it("identifica conversões por importação por seus marcadores técnicos", () => {
    const imported = { event_family: "IMPORT", event_identifier: "CSV Importação" };
    expect(isImportationEvent(imported)).toBe(true);
    expect(qualifiesDirectApiEvent(imported).qualifies).toBe(false);
  });
});

