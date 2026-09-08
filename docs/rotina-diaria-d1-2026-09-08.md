# Rotina diária MedSystems — execução de 08/09/2026

## Status e cobertura

A atualização foi concluída com corte D-1 de **07/09/2026, 23h59**, no fuso `America/Sao_Paulo`. RD Station, Bitrix24, Google Ads e Meta Ads alcançaram o corte. A mídia permaneceu restrita às quatro contas oficiais em BRL, no nível campanha, com `adGroupId` e `adId` vazios não nulos e upsert pela chave canônica. [1]

| Fonte | Maior data validada | Status |
|---|---:|---|
| RD Station — MedSystems | 07/09/2026 BRT | Atualizado |
| RD Station — BeautySystems | 07/09/2026 BRT | Atualizado |
| Bitrix24 — leads e contatos | 07/09/2026 BRT | Atualizado |
| Bitrix24 — negócios | 05/09/2026 BRT | Atualizado; nenhum negócio foi criado em 06–07/09 |
| Google Ads — duas contas oficiais | 07/09/2026 | Atualizado pelo Windsor.ai |
| Meta Ads — duas contas oficiais | 07/09/2026 | Atualizado pelo Windsor.ai |

## Leads do dia anterior

O KPI oficial de 07/09 é **40 contatos únicos de mídia paga conciliados**: 10 MedSystems e 30 BeautySystems. O RD Station armazenou 63 eventos em 60 contatos no dia; o KPI do funil é menor porque exige evidência paga, correspondência com o CRM e deduplicação por contato único. [2]

| Indicador D-1 | MedSystems | BeautySystems | Total |
|---|---:|---:|---:|
| Eventos RD armazenados | 28 | 35 | 63 |
| Contatos RD com evento | 27 | 33 | 60 |
| **Contatos únicos pagos conciliados** | **10** | **30** | **40** |
| MQLs | 1 | 9 | 10 |
| SQLs | 1 | 7 | 8 |
| Contatos com negócio vinculado | 0 | 0 | 0 |
| IDs Bitrix24 associados | 10 | 33 | 43 |
| Pessoas com múltiplos IDs | 0 | 3 | 3 |
| IDs excedentes por duplicidade | 0 | 3 | 3 |

## Acumulado de 01–07/09

O acumulado oficial contém **75 contatos únicos pagos**, sem somar snapshots diários: 35 MedSystems e 40 BeautySystems. Os 40 contatos do D-1 podem incluir pessoas que já converteram em dias anteriores; por isso, não são adicionados diretamente ao total mensal.

| Indicador MTD | MedSystems | BeautySystems | Total |
|---|---:|---:|---:|
| Contatos únicos pagos | **35** | **40** | **75** |
| MQLs | 28 | 33 | 61 |
| SQLs | 5 | 6 | 11 |
| Descartados | 2 | 1 | 3 |
| IDs Bitrix24 associados | 55 | 60 | 115 |
| Pessoas com múltiplos IDs | 11 | 13 | 24 |
| IDs excedentes por duplicidade | 20 | 20 | 40 |

## Bitrix24

A paginação integral de 01–07/09 retornou **478 leads, 370 contatos e 100 negócios**. Em 07/09 foram criados 44 leads, 36 contatos e nenhum negócio. O recorte utiliza o `DATE_CREATE` original convertido ao horário de Brasília antes da comparação do período.

## Investimento de mídia

| Plataforma e BU | Conta | Investimento MTD | Investimento 07/09 | Leads/conversões MTD da plataforma |
|---|---|---:|---:|---:|
| Google Ads — MedSystems | 672-710-7654 | R$ 2.954,64 | R$ 430,39 | 32 conversões |
| Meta Ads — MedSystems | 446269251699575 | R$ 11.641,40 | R$ 1.571,20 | 129 leads |
| **MedSystems — total** | — | **R$ 14.596,04** | **R$ 2.001,59** | **161 ações de lead/conversão** |
| Google Ads — BeautySystems | 864-759-2401 | R$ 2.790,15 | R$ 298,91 | 12 conversões |
| Meta Ads — BeautySystems | 1655942005167160 | R$ 9.078,88 | R$ 1.488,91 | 117 leads |
| **BeautySystems — total** | — | **R$ 11.869,03** | **R$ 1.787,82** | **129 ações de lead/conversão** |
| **Total geral** | — | **R$ 26.465,07** | **R$ 3.789,41** | **290 ações de lead/conversão** |

No D-1, MedSystems registrou 21 ações de lead/conversão de plataforma e BeautySystems, 18. As 218 linhas MTD correspondem a 218 chaves canônicas distintas; não houve combinação de campanha com anúncio nem soma de snapshots repetidos.

## Leads sem marca

A verificação do universo `entityType = lead`, `TITLE = Oportunidade do RD Station` e `UF_CRM_1744808620 = Tráfego Pago` encontrou **zero casos novos em 07/09** e **zero casos acumulados entre 01 e 07/09** fora dos pipelines 15391 e 15395. O pipeline 20889 (`Consumíveis`) e a campanha `medical-dsb-conversao-lead-ads` permanecem como mapeamento pendente; DSB continua sem significado e BU confirmados.

## Execução automática

Permanece um único job de conciliação às 09h BRT. Como esta atualização foi concluída antes desse horário, o snapshot de 07/09 já foi persistido manualmente e o próximo disparo apenas repetirá o upsert idempotente.

## Referências internas

[1]: ./agendamento-dashboard-diario.txt "Contrato permanente da atualização diária"
[2]: ./padrao-canonico-leads-midia-paga-bitrix-2026-09-02.md "Padrão source-first por contato único"
[3]: ./rotina-diaria-d1-2026-09-07.md "Execução D-1 anterior"
