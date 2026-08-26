import csv
import json
from collections import Counter
from pathlib import Path

source = Path("/tmp/meeting-match-rd-bitrix-2026-08-01-a-2026-08-24.json")
out_dir = Path("/home/ubuntu/exports/rd-bitrix-2026-08-01-a-2026-08-24")
out_dir.mkdir(parents=True, exist_ok=True)
csv_path = out_dir / "Conciliacao_RD_Bitrix_2026-08-01_a_2026-08-24.csv"
summary_path = out_dir / "Resumo_Conciliacao_RD_Bitrix_2026-08-01_a_2026-08-24.json"

payload = json.loads(source.read_text(encoding="utf-8"))
rows = []
for item in payload["rows"]:
    rd = item["rd"]
    match = item.get("match") or {}
    bitrix_fields = match.get("fields") or {}
    bitrix_utm = bitrix_fields.get("utm") or {}
    methods = match.get("matchMethods") or []
    rows.append({
        "conta_rd": rd.get("accountKey", ""),
        "uuid_rd": rd.get("contactUuid", ""),
        "nome_rd": rd.get("name", ""),
        "email_rd": rd.get("email", ""),
        "telefone_rd": rd.get("phone", ""),
        "criado_em_rd": rd.get("createdAtRd", ""),
        "ultima_conversao_rd": rd.get("lastConversionAt", ""),
        "evento_utm_em_rd": rd.get("rdUtmEventAt", ""),
        "evento_rd": rd.get("rdLastEventIdentifier", ""),
        "origem_rd": rd.get("origem_rd", ""),
        "utm_source_rd": rd.get("utm_source_rd", ""),
        "utm_medium_rd": rd.get("utm_medium_rd", ""),
        "utm_campaign_rd": rd.get("utm_campaign_rd", ""),
        "utm_content_rd": rd.get("utm_content_rd", ""),
        "utm_term_rd": rd.get("utm_term_rd", ""),
        "classificacao_match": item.get("status", ""),
        "metodo_match": "+".join(methods),
        "quantidade_candidatos": match.get("candidateCount", 0),
        "ambiguo": bool(match.get("ambiguous", False)),
        "bitrix_id": match.get("bitrixId", ""),
        "titulo_bitrix": match.get("title", ""),
        "nome_bitrix": match.get("fullName", ""),
        "etapa_bitrix": match.get("stageOrStatus", ""),
        "criado_em_bitrix": match.get("createdAtBitrix", ""),
        "atualizado_em_bitrix": match.get("updatedAtBitrix", ""),
        "origem_bitrix": bitrix_fields.get("source", ""),
        "utm_source_bitrix": bitrix_utm.get("source", ""),
        "utm_medium_bitrix": bitrix_utm.get("medium", ""),
        "utm_campaign_bitrix": bitrix_utm.get("campaign", ""),
        "utm_content_bitrix": bitrix_utm.get("content", ""),
        "utm_term_bitrix": bitrix_utm.get("term", ""),
    })

with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
    writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)

summary = {
    "periodo": payload["period"],
    "regra": payload["rule"],
    "total_rd": len(rows),
    "encontrados_bitrix": sum(bool(row["bitrix_id"]) for row in rows),
    "sem_correspondencia": sum(not bool(row["bitrix_id"]) for row in rows),
    "por_classificacao": dict(Counter(row["classificacao_match"] for row in rows)),
    "por_conta": dict(Counter(row["conta_rd"] for row in rows)),
    "arquivo_csv": str(csv_path),
}
summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(summary, ensure_ascii=False, indent=2))
