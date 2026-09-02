export type LeadBridgeBrand = "medsystems" | "beautysystems";

type ReferenceBrandRow = {
  accountKey: LeadBridgeBrand;
  sourceVolume: number;
  uniqueContacts: number;
  managerReported: number | null;
};

type PipelineOption = { label: string; count: number };

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function classifyPipelineBrand(label: string): LeadBridgeBrand | null {
  const normalized = normalizeLabel(label);
  if (normalized.includes("beauty") || normalized.includes("negocios e redes")) return "beautysystems";
  if (normalized.includes("medsystems")) return "medsystems";
  return null;
}

export function buildLeadBridge(referenceRows: ReferenceBrandRow[], pipelineOptions: PipelineOption[]) {
  const bitrixByBrand = pipelineOptions.reduce<Record<LeadBridgeBrand, number>>(
    (totals, option) => {
      const brand = classifyPipelineBrand(option.label);
      if (brand) totals[brand] += option.count;
      return totals;
    },
    { medsystems: 0, beautysystems: 0 },
  );

  const referenceByBrand = new Map(referenceRows.map(row => [row.accountKey, row]));
  const rows = (["medsystems", "beautysystems"] as const).map(accountKey => {
    const reference = referenceByBrand.get(accountKey);
    return {
      accountKey,
      sourceVolume: reference?.sourceVolume ?? 0,
      uniqueContacts: reference?.uniqueContacts ?? 0,
      managerReported: reference?.managerReported ?? null,
      bitrixVolume: bitrixByBrand[accountKey],
    };
  });

  return {
    rows,
    totals: {
      sourceVolume: rows.reduce((sum, row) => sum + row.sourceVolume, 0),
      uniqueContacts: rows.reduce((sum, row) => sum + row.uniqueContacts, 0),
      managerReported: rows.every(row => row.managerReported !== null)
        ? rows.reduce((sum, row) => sum + Number(row.managerReported), 0)
        : null,
      bitrixVolume: pipelineOptions.reduce((sum, option) => sum + option.count, 0),
    },
  };
}
