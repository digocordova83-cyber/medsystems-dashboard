# Auditoria final de existência do CSV no Bitrix24 — 01/09/2026

## Conclusão

Com o CSV original reenviado, foi possível resolver os casos antes ambíguos por meio da combinação de nome normalizado com telefone, além de e-mail. As 86 linhas do CSV encontram ao menos um lead criado no Bitrix24 em 01/09/2026 no horário de Brasília.

| Recorte | Linhas do CSV | Pessoas únicas | Linhas com match no Bitrix24 | Pessoas com match | Leads Bitrix24 distintos no dia |
|---|---:|---:|---:|---:|---:|
| MedSystems | 41 | 35 | 41 | 35 | 39 |
| BeautySystems | 45 | 40 | 45 | 40 | 43 |
| Consolidado | 86 | 75 | 86 | 75 | 52 |

## Interpretação

Todos os registros da base possuem correspondência no Bitrix24, mas 86 linhas de conversão não equivalem a 86 leads únicos no CRM. A base contém 75 pessoas únicas, e essas pessoas estão associadas a 52 IDs distintos de lead criados no Bitrix24 no mesmo dia. Treze linhas do CSV encontram mais de um lead Bitrix24 para a mesma identidade.

Em MedSystems, as 41 linhas correspondem a 35 pessoas e 39 IDs distintos de lead no dia. Esse resultado reproduz o número 39 informado pelo gestor quando a unidade de contagem é o ID do lead Bitrix24. Em BeautySystems, as 45 linhas correspondem a 40 pessoas e 43 IDs distintos de lead no dia; portanto, o número 45 informado pelo gestor corresponde às linhas de conversão da fonte, não a IDs únicos do CRM.

## Regra recomendada

Para analisar o funil dentro do Bitrix24, a unidade correta é o ID único do lead no CRM. Para analisar geração de mídia, a unidade deve ser explicitada como conversão ou pessoa única. As três métricas devem permanecer separadas para evitar que duplicidades de conversão ou múltiplos leads para a mesma identidade sejam interpretados como falha de integração.

## Privacidade

O processamento ocorreu localmente. O documento registra apenas agregados; nomes, e-mails e telefones não foram incluídos nas saídas.
