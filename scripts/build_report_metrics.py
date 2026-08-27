import json
from pathlib import Path

rows = {
    "2026-07": {
        "Medsystems": {"leads": 267, "mql": 191, "sql": 27, "discarded": 76, "spend": 10658.79, "platform_leads": 208},
        "BeautySystems": {"leads": 758, "mql": 581, "sql": 46, "discarded": 176, "spend": 12434.72, "platform_leads": 225},
    },
    "2026-08-MTD": {
        "Medsystems": {"leads": 225, "mql": 159, "sql": 11, "discarded": 58, "spend": 39061.41, "platform_leads": 562},
        "BeautySystems": {"leads": 719, "mql": 634, "sql": 38, "discarded": 71, "spend": 35003.29, "platform_leads": 490},
    },
}

def pct(n, d):
    return 100 * n / d if d else 0

def enrich(r):
    r = dict(r)
    r.update({
        "lead_to_mql": pct(r["mql"], r["leads"]),
        "mql_to_sql": pct(r["sql"], r["mql"]),
        "lead_to_sql": pct(r["sql"], r["leads"]),
        "discard_rate": pct(r["discarded"], r["leads"]),
        "spend_per_platform_lead": r["spend"] / r["platform_leads"] if r["platform_leads"] else None,
    })
    return r

for period in rows:
    for bu in rows[period]:
        rows[period][bu] = enrich(rows[period][bu])

def total(period):
    values = list(rows[period].values())
    out = {key: sum(v[key] for v in values) for key in ["leads", "mql", "sql", "discarded", "spend", "platform_leads"]}
    return enrich(out)

result = {"rows": rows, "totals": {period: total(period) for period in rows}}
result["delta"] = {}
for bu in ["Medsystems", "BeautySystems"]:
    old, new = rows["2026-07"][bu], rows["2026-08-MTD"][bu]
    result["delta"][bu] = {
        "leads_pct": pct(new["leads"] - old["leads"], old["leads"]),
        "mql_pct": pct(new["mql"] - old["mql"], old["mql"]),
        "sql_pct": pct(new["sql"] - old["sql"], old["sql"]),
        "spend_pct": pct(new["spend"] - old["spend"], old["spend"]),
        "lead_to_mql_pp": new["lead_to_mql"] - old["lead_to_mql"],
        "mql_to_sql_pp": new["mql_to_sql"] - old["mql_to_sql"],
        "lead_to_sql_pp": new["lead_to_sql"] - old["lead_to_sql"],
        "discard_rate_pp": new["discard_rate"] - old["discard_rate"],
        "spend_per_platform_lead_pct": pct(new["spend_per_platform_lead"] - old["spend_per_platform_lead"], old["spend_per_platform_lead"]),
    }
result["delta"]["Total"] = {
    "leads_pct": pct(result["totals"]["2026-08-MTD"]["leads"] - result["totals"]["2026-07"]["leads"], result["totals"]["2026-07"]["leads"]),
    "mql_pct": pct(result["totals"]["2026-08-MTD"]["mql"] - result["totals"]["2026-07"]["mql"], result["totals"]["2026-07"]["mql"]),
    "sql_pct": pct(result["totals"]["2026-08-MTD"]["sql"] - result["totals"]["2026-07"]["sql"], result["totals"]["2026-07"]["sql"]),
    "spend_pct": pct(result["totals"]["2026-08-MTD"]["spend"] - result["totals"]["2026-07"]["spend"], result["totals"]["2026-07"]["spend"]),
    "lead_to_mql_pp": result["totals"]["2026-08-MTD"]["lead_to_mql"] - result["totals"]["2026-07"]["lead_to_mql"],
    "mql_to_sql_pp": result["totals"]["2026-08-MTD"]["mql_to_sql"] - result["totals"]["2026-07"]["mql_to_sql"],
    "lead_to_sql_pp": result["totals"]["2026-08-MTD"]["lead_to_sql"] - result["totals"]["2026-07"]["lead_to_sql"],
    "discard_rate_pp": result["totals"]["2026-08-MTD"]["discard_rate"] - result["totals"]["2026-07"]["discard_rate"],
    "spend_per_platform_lead_pct": pct(result["totals"]["2026-08-MTD"]["spend_per_platform_lead"] - result["totals"]["2026-07"]["spend_per_platform_lead"], result["totals"]["2026-07"]["spend_per_platform_lead"]),
}
Path("/tmp/report_metrics.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps(result, ensure_ascii=False, indent=2))
