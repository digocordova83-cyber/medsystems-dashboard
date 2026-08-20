from collections import Counter
from pathlib import Path

from openpyxl import load_workbook


INPUT = Path("/home/ubuntu/upload/LeadsRecebidos19.08.xlsx")
OUTPUT = Path("/home/ubuntu/medsystems-rdstation-oauth/docs/inspecao_exportacao_bitrix_19-08.txt")

wb = load_workbook(INPUT, read_only=True, data_only=True)
properties = wb.properties
filter_workbook = load_workbook(INPUT, read_only=False, data_only=True)
filter_refs = {worksheet.title: worksheet.auto_filter.ref for worksheet in filter_workbook.worksheets}
filter_workbook.close()
lines: list[str] = [
    f"Arquivo: {INPUT.name}",
    f"Abas: {', '.join(wb.sheetnames)}",
    f"Criado no arquivo: {properties.created or 'não informado'}",
    f"Modificado no arquivo: {properties.modified or 'não informado'}",
    f"Autor: {properties.creator or 'não informado'}",
    f"Último modificador: {properties.lastModifiedBy or 'não informado'}",
    "",
]

for ws in wb.worksheets:
    rows = ws.iter_rows(values_only=True)
    headers = next(rows, ())
    headers = [str(value).strip() if value is not None else f"coluna_{index + 1}" for index, value in enumerate(headers)]
    non_empty = Counter()
    categorical = {index: Counter() for index, header in enumerate(headers) if any(token in header.lower() for token in ("pipeline", "funil", "etapa", "status", "origem", "marca", "empresa", "responsável"))}
    pipeline_by_day = Counter()
    created_index = headers.index("Criado") if "Criado" in headers else None
    pipeline_index = headers.index("Pipeline de Vendas") if "Pipeline de Vendas" in headers else None
    count = 0

    for row in rows:
        count += 1
        for index, value in enumerate(row):
            if value not in (None, ""):
                non_empty[index] += 1
                if index in categorical:
                    categorical[index][str(value).strip()] += 1
        if created_index is not None and pipeline_index is not None:
            created_value = row[created_index]
            pipeline_value = row[pipeline_index]
            if created_value not in (None, "") and pipeline_value not in (None, ""):
                day = created_value.strftime("%Y-%m-%d") if hasattr(created_value, "strftime") else str(created_value).strip()[:10]
                pipeline_by_day[(str(pipeline_value).strip(), day)] += 1

    lines.extend([f"Aba: {ws.title}", f"Registros: {count}", "Campos:"])
    if filter_refs.get(ws.title):
        lines.append(f"Filtro automático salvo: {filter_refs[ws.title]}")
    lines.extend(f"- {header}: {non_empty[index]} preenchidos" for index, header in enumerate(headers))
    if categorical:
        lines.append("Valores categóricos observados:")
        for index, values in categorical.items():
            display = "; ".join(f"{label} ({total})" for label, total in values.most_common(25)) or "sem valores"
            lines.append(f"- {headers[index]}: {display}")
    if pipeline_by_day:
        lines.append("Leads por dia e Pipeline de Vendas:")
        for (pipeline, day), total in sorted(pipeline_by_day.items()):
            lines.append(f"- {day} | {pipeline}: {total}")
    lines.append("")

OUTPUT.write_text("\n".join(lines), encoding="utf-8")
print(OUTPUT)
