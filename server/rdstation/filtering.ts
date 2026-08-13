export type SourceBucket = "midia_paga" | "desconhecido" | "outros_canais" | "outras_publicidades" | "nao_permitida";

export const ALLOWED_SOURCE_BUCKETS: SourceBucket[] = [
  "midia_paga",
  "desconhecido",
  "outros_canais",
  "outras_publicidades",
];

export function decodeTrafficSource(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const encoded = value.startsWith("encoded_") ? value.slice("encoded_".length) : value;
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    const source = decoded.current_session?.value ?? decoded.first_session?.value ?? "";
    return typeof source === "string" ? source : "";
  } catch {
    return value;
  }
}

export function classifySource(value: unknown): SourceBucket {
  const source = decodeTrafficSource(value).toLowerCase();
  if (!source || source === "(none)" || source === "(not set)" || source === "direct") return "desconhecido";
  if (/(utm_medium=(cpc|ppc|paid|paid_social)|gclid=|fbclid=|msclkid=|utm_source=(google|facebook|instagram|linkedin|tiktok|bing).*utm_medium=)/.test(source)) return "midia_paga";
  if (/(referral|partner|afiliad|display|banner|native|programmatic|outbrain|taboola)/.test(source)) return "outras_publicidades";
  if (/(utm_|organic|social|email|whatsapp|linkedin|instagram|facebook|youtube|google)/.test(source)) return "outros_canais";
  return "nao_permitida";
}

export function isImportationEvent(event: Record<string, unknown>) {
  const payload = event.payload && typeof event.payload === "object" ? event.payload as Record<string, unknown> : {};
  const marker = [
    event.event_family,
    event.event_identifier,
    payload.conversion_identifier,
    payload.conversion_resource,
    payload.resource,
  ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
  return /(importa[cç][aã]o|importation|imported|csv_import|bulk_import)/.test(marker);
}

export function qualifiesDirectApiEvent(event: Record<string, unknown>) {
  const payload = event.payload && typeof event.payload === "object" ? event.payload as Record<string, unknown> : {};
  const sourceBucket = classifySource(payload.traffic_source);
  return {
    sourceBucket,
    isImportation: isImportationEvent(event),
    qualifies: ALLOWED_SOURCE_BUCKETS.includes(sourceBucket) && !isImportationEvent(event),
  };
}
