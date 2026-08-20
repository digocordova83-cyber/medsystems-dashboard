import { medsystemsBitrixOperationsDashboard } from "../server/bitrix24/service.ts";

const [medsystems, beautysystems, consolidated] = await Promise.all([
  medsystemsBitrixOperationsDashboard("all", "medsystems", "2026-08"),
  medsystemsBitrixOperationsDashboard("all", "beautysystems", "2026-08"),
  medsystemsBitrixOperationsDashboard("all", "all", "2026-08"),
]);

console.log(JSON.stringify({
  period: "2026-08-01 a 2026-08-19 (São Paulo)",
  medsystems: { leads: medsystems.leads.total, method: medsystems.leadPipelineScope.method },
  beautysystems: { leads: beautysystems.leads.total, method: beautysystems.leadPipelineScope.method },
  recognizedPipelines: medsystems.leads.total + beautysystems.leads.total,
  leadsWithoutRecognizedPipeline: consolidated.leadPipelineScope.leadsWithoutRecognizedPipeline,
}, null, 2));
