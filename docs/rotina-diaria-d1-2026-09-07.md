# Rotina diária e acumulado de setembro — 07/09/2026

## Status do processamento

A atualização foi concluída em **07/09/2026** com corte D-1 de **06/09/2026, 23h59**, no fuso `America/Sao_Paulo`. RD Station, Bitrix24, Google Ads e Meta Ads alcançaram 06/09. A carga de mídia permaneceu restrita às quatro contas oficiais em BRL, no nível campanha, com `adGroupId` e `adId` vazios não nulos e upsert pela chave canônica. [1]

| Fonte | Maior data validada | Status |
|---|---:|---|
| RD Station — MedSystems | 06/09/2026 | Atualizado |
| RD Station — BeautySystems | 06/09/2026 | Atualizado |
| Bitrix24 — leads e contatos | 06/09/2026 BRT | Atualizado |
| Bitrix24 — negócios | 05/09/2026 BRT | Atualizado; nenhum negócio criado em 06/09 |
| Google Ads — duas contas oficiais | 06/09/2026 | Atualizado pelo Windsor.ai |
| Meta Ads — duas contas oficiais | 06/09/2026 | Atualizado pelo Windsor.ai |

## Leads do dia anterior

O KPI oficial de 06/09 é **44 contatos únicos de mídia paga conciliados**: 14 MedSystems e 30 BeautySystems. O RD Station armazenou 63 eventos brutos em 61 contatos no dia; a diferença decorre da regra de evidência paga, do de-para com o CRM e da deduplicação por contato único. [2]

| Indicador D-1 | MedSystems | BeautySystems | Total |
|---|---:|---:|---:|
| Eventos RD armazenados | 27 | 36 | 63 |
| Contatos RD com evento | 26 | 35 | 61 |
| **Contatos únicos pagos conciliados** | **14** | **30** | **44** |
| MQLs | 3 | 3 | 6 |
| SQLs | 2 | 0 | 2 |
| Contatos com negócio vinculado | 0 | 0 | 0 |
| IDs Bitrix24 associados | 16 | 33 | 49 |
| Pessoas com múltiplos IDs | 2 | 3 | 5 |
| IDs excedentes por duplicidade | 2 | 3 | 5 |

## Acumulado de 01–06/09

O acumulado oficial contém **75 contatos únicos pagos**, sem somar snapshots diários: 35 MedSystems e 40 BeautySystems. Foram classificados 61 MQLs e 11 SQLs; três contatos aparecem como descartados no estado atual do CRM.

| Indicador MTD | MedSystems | BeautySystems | Total |
|---|---:|---:|---:|
| Contatos únicos pagos | **35** | **40** | **75** |
| MQLs | 28 | 33 | 61 |
| SQLs | 5 | 6 | 11 |
| Descartados | 2 | 1 | 3 |
| IDs Bitrix24 associados | 55 | 60 | 115 |
| Pessoas com múltiplos IDs | 11 | 13 | 24 |
| IDs excedentes por duplicidade | 20 | 20 | 40 |

No universo bruto do RD Station, o período possui 200 eventos em 182 contatos MedSystems e 208 eventos em 192 contatos BeautySystems. Esses números não substituem o KPI pago conciliado.

## Bitrix24

A paginação integral do período retornou **434 leads, 334 contatos e 100 negócios**. Em 06/09 foram criados 53 leads, 43 contatos e nenhum negócio. A reconciliação passou a converter o offset original de `DATE_CREATE` para Brasília antes de comparar o período. Isso preserva, por exemplo, registros de 07/09 no horário do portal que ainda pertencem a 06/09 BRT, e remove apenas IDs ausentes após a paginação integral ser validada.

## Investimento de mídia

| Plataforma e BU | Conta | Investimento MTD | Investimento 06/09 | Leads/conversões MTD da plataforma |
|---|---|---:|---:|---:|
| Google Ads — MedSystems | 672-710-7654 | R$ 2.524,25 | R$ 364,42 | 29 conversões |
| Meta Ads — MedSystems | 446269251699575 | R$ 10.070,20 | R$ 1.753,88 | 111 leads |
| **MedSystems — total** | — | **R$ 12.594,45** | **R$ 2.118,30** | — |
| Google Ads — BeautySystems | 864-759-2401 | R$ 2.491,24 | R$ 339,73 | 11 conversões |
| Meta Ads — BeautySystems | 1655942005167160 | R$ 7.589,97 | R$ 1.626,77 | 100 leads |
| **BeautySystems — total** | — | **R$ 10.081,21** | **R$ 1.966,50** | — |
| **Total geral** | — | **R$ 22.675,66** | **R$ 4.084,80** | — |

Os 156 registros de campanha possuem 156 chaves canônicas distintas: 30 por conta Google, 66 para Meta MedSystems e 60 para Meta BeautySystems. Não houve mistura de campanha com anúncio nem soma de snapshots repetidos.

## Leads sem marca

A verificação do universo `entityType = lead`, `TITLE = Oportunidade do RD Station` e `UF_CRM_1744808620 = Tráfego Pago` encontrou **zero casos novos em 06/09** e **zero casos acumulados entre 01 e 06/09** fora dos pipelines 15391 e 15395. O pipeline 20889 (`Consumíveis`) e a campanha `medical-dsb-conversao-lead-ads` permanecem como mapeamento pendente; DSB continua sem BU inferida.

## Exceção operacional

O callback das 09h BRT respondeu HTTP 200, porém executou antes da conclusão da carga principal e inicialmente registrou zero. Após as fontes alcançarem D-1, o snapshot de 06/09 foi recalculado e sobrescrito de forma idempotente com os valores corretos. Recomenda-se mover essa verificação de fallback para depois da janela real de conclusão da rotina principal ou dispará-la explicitamente ao final da carga.

## Validações

Foram aprovados 31 testes focados, incluindo regressão de fuso, conciliação source-first, regras comerciais e chave canônica de mídia. TypeScript e build de produção foram validados. Não foram expostos nomes, e-mails, telefones, hashes ou payloads de clientes.

## Referências internas

[1]: ./agendamento-dashboard-diario.txt "Contrato permanente da atualização diária"
[2]: ./padrao-canonico-leads-midia-paga-bitrix-2026-09-02.md "Padrão source-first por contato único"
[3]: ./rotina-diaria-d1-2026-09-04.md "Execução D-1 anterior"
