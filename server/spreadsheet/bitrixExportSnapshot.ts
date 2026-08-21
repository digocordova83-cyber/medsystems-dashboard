export type SpreadsheetMetric = { label: string; count: number };

type BrandScope = {
  totalLeads: number;
  pipelines: { label: string; brand: string; count: number }[];
  origins: SpreadsheetMetric[];
  stages: SpreadsheetMetric[];
  dailyByPipeline: { date: string; medsystems: number; beautysystems: number }[];
};

const dates = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"];
const medsystemsDaily = [12, 11, 28, 23, 30, 26, 12, 21, 14, 19, 26, 19, 17, 16, 14, 10, 15, 14, 26];
const beautySystemsDaily = [34, 31, 32, 40, 45, 33, 30, 23, 37, 24, 35, 34, 34, 33, 22, 39, 43, 43, 36];
const dailyRows = (scope: "all" | "medsystems" | "beautysystems") => dates.map((day, index) => ({
  date: `2026-08-${day}`,
  medsystems: scope === "beautysystems" ? 0 : medsystemsDaily[index],
  beautysystems: scope === "medsystems" ? 0 : beautySystemsDaily[index],
}));

const scopes: Record<"all" | "medsystems" | "beautysystems", BrandScope> = {
  all: {
    totalLeads: 1001,
    pipelines: [{ label: "Negócios e Redes", brand: "BeautySystems", count: 648 }, { label: "Medsystems", brand: "Medsystems", count: 353 }],
    origins: [{ label: "Tráfego pago", count: 626 }, { label: "Tráfego orgânico", count: 257 }, { label: "Outros", count: 82 }, { label: "Social", count: 34 }, { label: "Instagram MKT · Medsystems", count: 1 }, { label: "Chamada", count: 1 }],
    stages: [{ label: "Primeiro contato", count: 479 }, { label: "Lead descartado", count: 126 }, { label: "Terceiro contato", count: 116 }, { label: "SDR", count: 108 }, { label: "Relacionamento", count: 80 }, { label: "Segundo contato", count: 46 }, { label: "Histórico de leads repassados", count: 35 }, { label: "Lead descartado p/ MKT", count: 11 }],
    dailyByPipeline: dailyRows("all"),
  },
  medsystems: {
    totalLeads: 353,
    pipelines: [{ label: "Medsystems", brand: "Medsystems", count: 353 }],
    origins: [{ label: "Tráfego pago", count: 143 }, { label: "Tráfego orgânico", count: 119 }, { label: "Outros", count: 67 }, { label: "Social", count: 24 }],
    stages: [{ label: "Primeiro contato", count: 136 }, { label: "Lead descartado", count: 59 }, { label: "SDR", count: 57 }, { label: "Relacionamento", count: 50 }, { label: "Histórico de leads repassados", count: 18 }, { label: "Terceiro contato", count: 18 }, { label: "Segundo contato", count: 13 }, { label: "Lead descartado p/ MKT", count: 2 }],
    dailyByPipeline: dailyRows("medsystems"),
  },
  beautysystems: {
    totalLeads: 648,
    pipelines: [{ label: "Negócios e Redes", brand: "BeautySystems", count: 648 }],
    origins: [{ label: "Tráfego pago", count: 483 }, { label: "Tráfego orgânico", count: 138 }, { label: "Outros", count: 15 }, { label: "Social", count: 10 }, { label: "Instagram MKT · Medsystems", count: 1 }, { label: "Chamada", count: 1 }],
    stages: [{ label: "Primeiro contato", count: 343 }, { label: "Terceiro contato", count: 98 }, { label: "Lead descartado", count: 67 }, { label: "SDR", count: 51 }, { label: "Segundo contato", count: 33 }, { label: "Relacionamento", count: 30 }, { label: "Histórico de leads repassados", count: 17 }, { label: "Lead descartado p/ MKT", count: 9 }],
    dailyByPipeline: dailyRows("beautysystems"),
  },
};

export const bitrixExportSnapshot = {
  source: {
    label: "Planilha Bitrix24 enviada",
    fileName: "LeadsRecebidos19.08.xlsx",
    worksheet: "Base",
    periodLabel: "01/08 a 19/08/2026",
    scope: "Snapshot da planilha após retirar registros com Fonte igual a Evento.",
  },
  period: { start: "2026-08-01", end: "2026-08-19", days: 19 },
  eventExclusion: { field: "Fonte", label: "Evento", excluded: 1591, remaining: 1001 },
  scopes,
} as const;
