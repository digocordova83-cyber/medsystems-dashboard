from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
import json

from openpyxl import load_workbook


INPUT = Path("/home/ubuntu/upload/LeadsRecebidos19.08.xlsx")
SAFE_CATEGORY_FIELDS = [
    "Fonte",
    "Etapa",
    "Pipeline de Vendas",
    "Tecnologia",
    "RD Station",
    "Produto de Interesse",
    "Segmento",
    "UF - PF",
    "Lead repetido",
    "Motivo de declínio - WF0",
]
COVERAGE_FIELDS = [
    "Telefone de trabalho",
    "Informações da fonte",
    "Nome da Empresa",
    "Produto de Interesse",
    "Vendedor Responsável",
]


def text(value):
    return str(value).strip() if value not in (None, "") else "Não informado"


workbook = load_workbook(INPUT, read_only=True, data_only=True)
worksheet = workbook["Base"]
rows = worksheet.iter_rows(values_only=True)
headers = [str(value).strip() if value is not None else "" for value in next(rows)]
indexes = {header: index for index, header in enumerate(headers)}
categories = {field: Counter() for field in SAFE_CATEGORY_FIELDS}
coverage = Counter()
daily_by_pipeline = defaultdict(Counter)
total_value = 0.0
records = 0

for row in rows:
    records += 1
    for field in SAFE_CATEGORY_FIELDS:
        categories[field][text(row[indexes[field]])] += 1
    for field in COVERAGE_FIELDS:
        if row[indexes[field]] not in (None, ""):
            coverage[field] += 1
    created = row[indexes["Criado"]]
    pipeline = text(row[indexes["Pipeline de Vendas"]])
    if hasattr(created, "strftime"):
        daily_by_pipeline[created.strftime("%Y-%m-%d")][pipeline] += 1
    value = row[indexes["Total"]]
    if isinstance(value, (int, float)):
        total_value += value

result = {
    "file": INPUT.name,
    "records": records,
    "dateRange": {
        "start": min(daily_by_pipeline).replace("-", "/"),
        "end": max(daily_by_pipeline).replace("-", "/"),
    },
    "totalValue": total_value,
    "categories": {
        field: [{"label": label, "count": count} for label, count in values.most_common()]
        for field, values in categories.items()
    },
    "coverage": [{"field": field, "count": coverage[field]} for field in COVERAGE_FIELDS],
    "dailyByPipeline": [
        {"date": date, **dict(values)}
        for date, values in sorted(daily_by_pipeline.items())
    ],
}
print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
