# Validação — volume de leads Bitrix24 por Pipeline de Vendas

**Recorte:** 01 a 18/08/2026, conforme dados Bitrix24 atualmente sincronizados.

| Marca selecionada | Campo Bitrix24 | Pipeline aplicado | Leads retornados | Leads sem pipeline reconhecido no recorte |
|---|---|---|---:|---:|
| Medsystems | `UF_CRM_1739195085` | `15391` — Medsystems | 318 | 107 |
| BeautySystems | `UF_CRM_1739195085` | `15395` — Negócios e Redes | 2.169 | 107 |

O campo foi identificado na exportação fornecida como **Pipeline de Vendas** e confirmado nos metadados da API Bitrix24. Valores diferentes de `15391` e `15395`, vazios ou não reconhecidos permanecem fora dos filtros de marca e são comunicados como **não identificados**.

O volume de contatos criados não é exibido sob filtro individual porque não existe vínculo de pipeline comprovado para os contatos no recorte. A regra não usa nome, telefone ou e-mail para inferir a marca.
