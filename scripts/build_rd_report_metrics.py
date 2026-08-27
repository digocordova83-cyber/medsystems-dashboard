import json
from pathlib import Path

rows = {
    "2026-07": {
        "Medsystems": {"converted_contacts": 967, "utm_leads": 444, "events": 967},
        "BeautySystems": {"converted_contacts": 806, "utm_leads": 418, "events": 806},
    },
    "2026-08-MTD": {
        "Medsystems": {"converted_contacts": 1126, "utm_leads": 498, "events": 1279},
        "BeautySystems": {"converted_contacts": 2749, "utm_leads": 446, "events": 2875},
    },
}

def pct(n, d): return 100 * n / d if d else 0
for period, brands in rows.items():
    for bu, r in brands.items():
        r["utm_coverage"] = pct(r["utm_leads"], r["converted_contacts"])

def total(period):
    vals = list(rows[period].values())
    out = {k: sum(v[k] for v in vals) for k in ["converted_contacts", "utm_leads", "events"]}
    out["utm_coverage"] = pct(out["utm_leads"], out["converted_contacts"])
    return out
result = {"rows": rows, "totals": {p: total(p) for p in rows}, "delta": {}}
for bu in ["Medsystems", "BeautySystems"]:
    old, new = rows["2026-07"][bu], rows["2026-08-MTD"][bu]
    result["delta"][bu] = {
        "converted_contacts_pct": pct(new["converted_contacts"] - old["converted_contacts"], old["converted_contacts"]),
        "utm_leads_pct": pct(new["utm_leads"] - old["utm_leads"], old["utm_leads"]),
        "coverage_pp": new["utm_coverage"] - old["utm_coverage"],
    }
old, new = result["totals"]["2026-07"], result["totals"]["2026-08-MTD"]
result["delta"]["Total"] = {
    "converted_contacts_pct": pct(new["converted_contacts"] - old["converted_contacts"], old["converted_contacts"]),
    "utm_leads_pct": pct(new["utm_leads"] - old["utm_leads"], old["utm_leads"]),
    "coverage_pp": new["utm_coverage"] - old["utm_coverage"],
}
Path('/tmp/rd_report_metrics.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps(result, ensure_ascii=False, indent=2))
