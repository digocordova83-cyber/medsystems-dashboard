import { describe, expect, it } from "vitest";
import { buildLeadBridge, classifyPipelineBrand } from "../shared/leadBridge";

describe("leadBridge", () => {
  it("mapeia os pipelines Bitrix sem confundir as marcas", () => {
    expect(classifyPipelineBrand("BeautySystems · Negócios e Redes")).toBe("beautysystems");
    expect(classifyPipelineBrand("Medsystems")).toBe("medsystems");
    expect(classifyPipelineBrand("Consumíveis")).toBeNull();
  });

  it("mantém fonte, pessoas, gestor e Bitrix como métricas separadas", () => {
    const bridge = buildLeadBridge(
      [
        { accountKey: "medsystems", sourceVolume: 41, uniqueContacts: 35, managerReported: 39 },
        { accountKey: "beautysystems", sourceVolume: 45, uniqueContacts: 40, managerReported: 45 },
      ],
      [
        { label: "BeautySystems · Negócios e Redes", count: 41 },
        { label: "Medsystems", count: 9 },
      ],
    );

    expect(bridge.totals).toEqual({ sourceVolume: 86, uniqueContacts: 75, managerReported: 84, bitrixVolume: 50 });
    expect(bridge.rows).toEqual([
      { accountKey: "medsystems", sourceVolume: 41, uniqueContacts: 35, managerReported: 39, bitrixVolume: 9 },
      { accountKey: "beautysystems", sourceVolume: 45, uniqueContacts: 40, managerReported: 45, bitrixVolume: 41 },
    ]);
  });
});
