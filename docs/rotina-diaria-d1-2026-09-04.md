# Rotina diária D-1 — 04/09/2026

## Status e corte

A atualização foi executada em **04/09/2026** com corte operacional de **03/09/2026, 00h00–23h59**, no fuso `America/Sao_Paulo`. RD Station, Bitrix24 e Google Ads alcançaram D-1. Meta Ads não foi atualizado porque o token da fonte Meta dentro do Windsor.ai retornou `authorization required`; a última data válida preservada é 02/09/2026. Nenhum valor anterior foi promovido para D-1 e nenhum zero foi usado como substituição.

| Fonte | Cobertura | Status |
|---|---:|---|
| RD Station — MedSystems | 03/09/2026 | Atualizado |
| RD Station — BeautySystems | 03/09/2026 | Atualizado |
| Bitrix24 — leads, contatos e negócios | 03/09/2026 BRT | Atualizado |
| Google Ads — duas contas oficiais | 03/09/2026 | Atualizado pelo Windsor.ai |
| Meta Ads — duas contas oficiais | 02/09/2026 | Não alcançou D-1; autorização do provedor expirou no Windsor.ai |

## Leads e conciliação

O RD Station processou **5 eventos de conversão em 4 contatos MedSystems** e **3 eventos em 3 contatos BeautySystems**. Após aplicar evidência paga na fonte, de-para de identidade e deduplicação por contato, o KPI oficial ficou em **6 contatos únicos de mídia paga conciliados**: 4 MedSystems e 2 BeautySystems.

| Indicador D-1 | MedSystems | BeautySystems | Total |
|---|---:|---:|---:|
| Contatos processados no RD | 4 | 3 | 7 |
| Eventos RD armazenados | 5 | 3 | 8 |
| Contatos únicos pagos conciliados | **4** | **2** | **6** |
| MQLs | 1 | 1 | 2 |
| SQLs | 0 | 0 | 0 |
| Contatos com negócio vinculado | 0 | 0 | 0 |
| IDs Bitrix24 associados | 4 | 2 | 6 |
| Pessoas com múltiplos IDs | 0 | 0 | 0 |

O snapshot foi persistido com `ruleVersion = bitrix_unique_contact_v2`. O Bitrix24 recebeu no corte local **75 leads, 64 contatos e 17 negócios**; a atualização mês-até-D-1 reprocessou 246 leads, 216 contatos e 68 negócios por `DATE_CREATE`, usando upsert.

## Investimento de mídia

| Plataforma e BU | Conta oficial | Investimento D-1 | Impressões | Cliques | Conversões da plataforma |
|---|---|---:|---:|---:|---:|
| Google Ads — MedSystems | 672-710-7654 | R$ 355,43 | 2.995 | 161 | 7 |
| Google Ads — BeautySystems | 864-759-2401 | R$ 401,76 | 5.572 | 147 | 3 |
| **Google Ads — total** | — | **R$ 757,19** | **8.567** | **308** | **10** |
| Meta Ads — MedSystems | 446269251699575 | N/D | N/D | N/D | N/D |
| Meta Ads — BeautySystems | 1655942005167160 | N/D | N/D | N/D | N/D |

As dez campanhas Google foram persistidas no nível campanha, com `adGroupId` e `adId` vazios não nulos. Cada conta contém cinco linhas e cinco `campaign_id` distintos em 03/09, confirmando ausência de duplicação pela chave canônica. Meta permanece N/D no D-1 até a renovação da autorização no Windsor.ai.

## Leads sem marca

A verificação do universo `entityType = lead`, `TITLE = Oportunidade do RD Station` e `UF_CRM_1744808620 = Tráfego Pago` retornou **zero casos novos em 03/09** e **zero casos acumulados entre 01 e 03/09** fora dos pipelines 15391 e 15395. Portanto, não há agrupamentos por pipeline, campanha ou origem neste corte. O pipeline 20889 (`Consumíveis`) e a campanha `medical-dsb-conversao-lead-ads` permanecem como mapeamento pendente; DSB continua sem BU inferida.

## Correção do Heartbeat

O callback de conciliação falhava com HTTP 503 por estouro de memória ao carregar todo o histórico Bitrix24. A consulta foi substituída por paginação de 250 leads, pré-seleção source-first e carregamento integral apenas de contatos e negócios vinculados aos candidatos. O callback publicado passou a responder HTTP 200 em aproximadamente 5 segundos. Permanece um único job oficial, às **09h BRT**, depois da rotina principal das 08h.

## Validações

Foram aprovados 28 testes focados, TypeScript e build de produção. O resultado source-first validado de 02/09 permaneceu idêntico após a otimização, e o snapshot de 03/09 foi recalculado após as cargas. Não foram expostos nomes, e-mails, telefones ou hashes.

## Referências internas

[1]: ./agendamento-dashboard-diario.txt "Contrato permanente da atualização diária"
[2]: ./padrao-canonico-leads-midia-paga-bitrix-2026-09-02.md "Padrão source-first por contato único"
[3]: ./rotina-diaria-d1-2026-09-03.md "Execução D-1 anterior"
