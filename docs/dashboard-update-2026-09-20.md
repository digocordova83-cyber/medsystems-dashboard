# Atualização D-1 do Dashboard — 20/09/2026

## Escopo e regra de corte

O Dashboard foi atualizado com corte fechado em **20/09/2026**, no fuso **America/Sao_Paulo**, executado em 21/09/2026. A atualização preserva a metodologia `rd_bitrix_multi_v1` na aba **Negócios**: contatos qualificados do RD Station são conciliados com Leads do Bitrix24 por e-mail exato e, quando não há e-mail correspondente, por nome normalizado. Em correspondências múltiplas, todos os Leads técnicos candidatos permanecem no funil e são sinalizados separadamente. A BU é definida exclusivamente pelos pipelines 15391 (MedSystems) e 15395 (BeautySystems); demais pipelines não recebem BU inferida.

## Fontes sincronizadas

| Fonte | Cobertura confirmada | Resultado da execução |
|---|---|---|
| RD Station | Contatos e eventos até 20/09 | MedSystems: 3.569 contatos importados, 204 contatos processados e 225 eventos armazenados. BeautySystems: 4.969 contatos importados, 211 contatos processados e 230 eventos armazenados. As contas ficaram em status `pronta`, sem erro de sincronização. |
| Bitrix24 | Registros criados em setembro até 20/09 | 1.359 Leads, 323 Negócios e 945 Contatos persistidos/referenciados no banco operacional. A maior data de criação de Lead chegou a 20/09 às 23:52 BRT; a maior data de criação de Negócio chegou a 20/09 às 18:56 BRT. |
| Google Ads | 01–20/09, quatro contas oficiais | R$ 21.648,70: R$ 10.983,38 MedSystems e R$ 10.665,32 BeautySystems; 125,0174 conversões de plataforma; 358.723 impressões e 11.412 cliques. |
| Meta Ads | 01–20/09, duas contas oficiais | R$ 57.848,36: R$ 30.823,60 MedSystems e R$ 27.024,76 BeautySystems; 592 leads de plataforma; 5.153.762 impressões e 18.324 cliques. A carga ad-level também foi atualizada até 20/09: 127 criativos ativos, todos com miniatura retornada pela fonte. |
| Publya / Push | Dados retornados até 20/09 | A conta Publya ficou `pronta`, com última data de dados em 20/09. O overview canônico exibe R$ 51.992,21, 900.948 impressões, 3.484 cliques e 408 leads Meta. O Push permanece com dados retornados até 29/08; a fonte não retornou disparos, cliques ou investimento de setembro, portanto nenhum valor foi estimado. |

## Investimento Google + Meta

| BU | Google Ads | Meta Ads | Google + Meta |
|---|---:|---:|---:|
| MedSystems | R$ 10.983,38 | R$ 30.823,60 | **R$ 41.806,98** |
| BeautySystems | R$ 10.665,32 | R$ 27.024,76 | **R$ 37.690,08** |
| **Consolidado** | **R$ 21.648,70** | **R$ 57.848,36** | **R$ 79.497,06** |

A leitura de custo por conversão de plataforma, sem misturar RD Station ou Bitrix24, é de aproximadamente **R$ 122,24 por conversão em MedSystems**, **R$ 100,51 em BeautySystems** e **R$ 110,87 no consolidado**. Google Ads e Meta Ads não retornaram valor de conversão/receita atribuída utilizável no corte: **ROAS por canal permanece indisponível**.

## Negócios e funil reconciliado

No acumulado de 01–20/09, o agregador da aba Negócios retornou:

| Indicador | MedSystems | BeautySystems | Consolidado |
|---|---:|---:|---:|
| Leads técnicos no universo RD→Bitrix | 380 | 1.130 | 1.510 |
| Contatos únicos RD conciliados | 303 | 837 | 1.140 |
| IDs técnicos Bitrix distintos | 301 | 752 | 1.053 |
| MQL | 221 | 844 | 1.065 |
| SQL | 25 | 59 | 84 |
| Negócios ganhos | 32 | 28 | 60 |
| Valor ganho | R$ 7.013.821,11 | R$ 6.928.001,00 | **R$ 13.941.822,11** |

Os volumes de contatos únicos, IDs técnicos e linhas do funil são unidades diferentes e não devem ser somados como se fossem pessoas. O resultado isolado de 20/09 foi de **18 contatos únicos e 19 IDs técnicos em MedSystems**, e **72 contatos únicos e 67 IDs técnicos em BeautySystems**. O snapshot diário foi persistido com status `completed` e regra `rd_bitrix_multi_v1`.

## Publya, programática e limitações

O overview Publya manteve visíveis as cinco fontes lógicas do escopo — PMAX, Meta, duas frentes de Programática Display e Push — e os relatórios oficiais correspondentes. A API retornou snapshots idênticos de investimento, impressões, cliques e custos para as duas campanhas de Display; para não duplicar o investimento, apenas uma ocorrência entra no KPI canônico. Como o alcance variou entre chamadas, o alcance consolidado é marcado como indisponível. Essa limitação é exibida na aba e não foi compensada por estimativa.

## Validação

A atualização foi auditada sem PII. Foram conferidas as datas máximas, as quatro contas oficiais de mídia, a chave canônica de campanha e a ausência de linhas provisórias por nome no nível de campanha: **651 linhas armazenadas e 651 chaves canônicas** no período, sem linhas com `name:`. A interface publicada foi revisada autenticada nas abas Overview, Google Ads, Meta Ads, Programática e Negócios. O título público permaneceu `Medsystems - Gerencial`.

Os testes, a checagem TypeScript e o build de produção devem ser executados após esta carga antes de qualquer novo checkpoint. A rotina diária existente permanece sem alteração de horário ou de metodologia.

## Ajuste de escopo posterior ao corte

Em 21/09/2026, foi solicitado retirar do Dashboard e do Report Executivo os leads dos pipelines **Aeskins** e **Advance Vision**. A alteração foi aplicada no agregado da aba Negócios antes de qualquer cálculo gerencial, sem excluir ou modificar os dados brutos no Bitrix24. Os pipelines técnicos excluídos são 15399 (Aeskins), 17287 (Aeskins Venda Recorrente) e 15389 (Advance). No recorte de 01–20/09, essa remoção retirou 101 linhas técnicas do universo geral: 97 de Aeskins e 4 de Advance; não havia linhas no pipeline Aeskins Venda Recorrente no corte.

As BUs reconhecidas não foram alteradas: MedSystems permanece com 380 leads técnicos, 221 MQLs e 25 SQLs; BeautySystems permanece com 1.130 leads técnicos, 844 MQLs e 59 SQLs. O Report Executivo foi atualizado até 20/09 com esses números, os investimentos Google + Meta de R$ 79.497,06 e os 60 negócios ganhos no período. A regressão correspondente foi coberta por teste automatizado.
