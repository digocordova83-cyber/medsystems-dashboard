# Report Lu — universo Bitrix24 com RD Station = sim

## Reset metodológico

Esta revisão ignora integralmente os universos anteriores baseados em título, origem externa, UTM como filtro de inclusão, evidência dinâmica do RD Station e conciliação source-first. O único critério de entrada é o campo oficial do próprio Bitrix24 `UF_CRM_1738950899 = 1`, equivalente a **RD Station = sim**, combinado apenas com `entityType = lead` e `DATE_CREATE` entre 01 e 07/09/2026.

## Totais por pipeline

| Classificação | Pipeline | Leads |
|---|---:|---:|
| MedSystems | 15391 | 161 |
| BeautySystems | 15395 | 236 |
| Não atribuído — Consumíveis | 20889 | 19 |
| Não atribuído — sem pipeline | N/D | 2 |
| **Total Bitrix24 RD Station = sim** | — | **418** |

Não há duplicidade de ID técnico no recorte. As BUs reconhecidas somam 397 leads; 21 permanecem fora das metas e dos CPLs por BU.

## Canais, somente por campos Bitrix24

| BU | Mídia paga | Evento | Orgânico | Referência | Não classificado | Total |
|---|---:|---:|---:|---:|---:|---:|
| MedSystems | 77 | 62 | 21 | 1 | 0 | 161 |
| BeautySystems | 193 | 0 | 33 | 4 | 6 | 236 |
| Não atribuído — 20889 | 17 | 0 | 0 | 0 | 2 | 19 |
| Não atribuído — sem pipeline | 0 | 0 | 0 | 0 | 2 | 2 |

Os canais são dimensões de leitura obtidas dos campos do Bitrix24 `UF_CRM_1744808620`, `SOURCE_DESCRIPTION`, `SOURCE_ID` e `UTM_MEDIUM`; nenhum deles exclui o lead do universo.

## Pacing e CPL por BU

| BU | Meta setembro | Esperado até 07/09 | Realizado | Pacing | Projeção linear | CPL geral | CPL mídia paga |
|---|---:|---:|---:|---:|---:|---:|---:|
| MedSystems | 680 | 159 | 161 | 101,5% | 690 | R$ 90,66 | R$ 189,56 |
| BeautySystems | 1.450 | 338 | 236 | 69,8% | 1.011 | R$ 50,29 | R$ 61,50 |
| **Total atribuído** | **2.130** | **497** | **397** | **79,9%** | **1.701** | **R$ 66,66** | **R$ 98,02** |

O investimento é usado somente como numerador financeiro externo e explicitamente rotulado: R$ 14.596,04 em MedSystems e R$ 11.869,03 em BeautySystems, total de R$ 26.465,07 em Google + Meta até 07/09. Programática não entra no CPL porque a Publya não retornou custo financeiro verificável.

## Referências

[1]: ../drizzle/schema.ts "Schema das entidades Bitrix24"
[2]: ../presentation/report_lu_bitrix_marketing_pacing_setembro_2026/ "Projeto visual Report Lu"
