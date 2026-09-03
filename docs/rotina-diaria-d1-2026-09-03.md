# Rotina diária D-1 — 03/09/2026

## Status e corte

A atualização foi concluída em **03/09/2026**, com corte operacional de **02/09/2026, 00h00–23h59**, em `America/Sao_Paulo`. RD Station, Bitrix24 e Windsor.ai alcançaram D-1. A carga usou as quatro contas oficiais, nível campanha, moeda BRL, chave canônica e upsert. Nenhum dado foi estimado.

| Fonte | Maior data observada | Status |
|---|---:|---|
| RD Station — MedSystems | 02/09/2026 | Alcançou D-1 |
| RD Station — BeautySystems | 02/09/2026 | Alcançou D-1 |
| Bitrix24 — leads | 02/09/2026 | Alcançou D-1 |
| Bitrix24 — contatos | 02/09/2026 | Alcançou D-1 |
| Bitrix24 — negócios | 02/09/2026 | Alcançou D-1 |
| Google Ads — duas contas oficiais | 02/09/2026 | Alcançou D-1 |
| Meta Ads — duas contas oficiais | 02/09/2026 | Alcançou D-1 |
| Publya Programática | 31/08/2026 | Provedor não devolveu D-1 |
| Publya Push | 29/08/2026 | Provedor não devolveu D-1 |

## RD Station e Bitrix24

No RD Station, o D-1 contém **45 contatos e 46 eventos** em MedSystems e **51 contatos e 53 eventos** em BeautySystems. A conciliação source-first identificou **63 contatos únicos de mídia paga**, sendo 19 MedSystems e 44 BeautySystems. O funil resultante contém 24 MQLs e 3 SQLs.

| Indicador D-1 | MedSystems | BeautySystems | Total |
|---|---:|---:|---:|
| Contatos RD com conversão | 45 | 51 | 96 |
| Eventos RD armazenados | 46 | 53 | 99 |
| Contatos únicos de mídia conciliados | **19** | **44** | **63** |
| MQLs | 8 | 16 | 24 |
| SQLs | 1 | 2 | 3 |
| Contatos com negócio vinculado | 0 | 0 | 0 |

O Bitrix24 registrou **87 leads, 82 contatos e 21 negócios** criados em 02/09. Para manter os estados do mês corrente atualizados sem depender do filtro `DATE_MODIFY`, que o portal devolveu como histórico integral, a rotina também reprocessou por `DATE_CREATE` o acumulado de 01–02/09: 171 leads, 152 contatos e 51 negócios.

## Investimento de mídia D-1

| Plataforma e BU | Conta oficial | Investimento | Impressões | Cliques | Leads/conversões da plataforma |
|---|---|---:|---:|---:|---:|
| Google Ads — MedSystems | 672-710-7654 | R$ 427,26 | 3.144 | 195 | 7 |
| Google Ads — BeautySystems | 864-759-2401 | R$ 428,91 | 5.305 | 139 | 3 |
| Meta Ads — MedSystems | 446269251699575 | R$ 1.839,56 | 90.847 | 581 | 23 |
| Meta Ads — BeautySystems | 1655942005167160 | R$ 1.347,13 | 17.286 | 336 | 22 |
| **Total** | — | **R$ 4.042,86** | **116.582** | **1.251** | **55** |

Por BU, MedSystems investiu **R$ 2.266,82** e BeautySystems **R$ 1.776,04**. O banco contém exatamente 5 campanhas de Google MedSystems, 5 de Google BeautySystems, 11 de Meta MedSystems e 9 de Meta BeautySystems no corte. Não foram encontrados duplicados para `plataforma + conta + data + campaign_id` no nível campanha.

A mesma carga Windsor foi executada uma segunda vez como teste de idempotência. A quantidade de linhas, campanhas e investimento permaneceu inalterada nas quatro contas, confirmando que o upsert substitui a versão da chave canônica em vez de somar outro snapshot.

## Leads sem marca

A verificação do universo `Lead` + `Oportunidade do RD Station` + `Tráfego Pago` retornou **zero casos novos em 02/09** e **zero casos acumulados entre 01 e 02/09**. Portanto, não há agrupamentos por pipeline, campanha ou origem a reportar neste corte. O pipeline `20889` (`Consumíveis`) e a campanha `medical-dsb-conversao-lead-ads` permanecem como mapeamento pendente; DSB não recebeu BU inferida.

## Snapshot e duplicidades

O snapshot foi persistido com `ruleVersion = bitrix_unique_contact_v2`. MedSystems possui 19 contatos únicos associados a 21 IDs Bitrix24; duas pessoas possuem múltiplos IDs, gerando dois IDs excedentes. BeautySystems possui 44 contatos únicos associados a 48 IDs; quatro pessoas possuem múltiplos IDs, gerando quatro IDs excedentes. Os IDs permanecem somente como contexto de auditoria e não aumentam o KPI oficial.

## Exceções operacionais

O Heartbeat de conciliação das 08h30 BRT recebeu HTTP 503 enquanto a carga principal ainda processava o CRM. O snapshot de 02/09 foi persistido manualmente e de forma idempotente. Para eliminar a sobreposição, o job foi movido para **09h00 BRT**; a rotina principal permanece às **08h00 BRT**.

Foram executados 27 testes focados em marca Bitrix24, regra source-first, snapshot diário, contas oficiais, chave canônica e deduplicação de campanha; todos foram aprovados.

## Referências internas

[1]: ./agendamento-dashboard-diario.txt "Contrato permanente da atualização diária"
[2]: ./padrao-canonico-leads-midia-paga-bitrix-2026-09-02.md "Padrão source-first por contato único"
[3]: ./contrato-rotina-diaria-2026-08-29.md "Contrato de fontes, contas e leads sem marca"
