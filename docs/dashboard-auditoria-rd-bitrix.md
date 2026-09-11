# Auditoria de leads RD Station ↔ Bitrix24

## Objetivo

A aba **Negócios** passa a conter uma auditoria protegida por login do Dashboard. Ela compara o volume de contatos únicos qualificados no RD Station com o volume de IDs técnicos de Lead criados no Bitrix24, sem substituir ou forçar a equivalência entre os universos.

## Regra de leitura

| Métrica | Regra aplicada |
|---|---|
| Contatos RD | Contato único com ao menos uma conversão no período cuja origem está entre as fontes permitidas e que não é importação. |
| Eventos RD | Todas as conversões qualificadas dos contatos no período. |
| Leads Bitrix | IDs técnicos de Lead criados no período selecionado. |
| RD Station = sim | Subconjunto dos Leads Bitrix com o campo oficial `UF_CRM_1738950899 = 1`. |
| Correspondência | E-mail e telefone normalizados. Lead tem prioridade; um contato vinculado ao mesmo Lead não é tratado como duplicidade. |

## Lista protegida

A lista rolável apresenta, somente em sessão autenticada, nome, e-mail, telefone, BU, data e origem da conversão RD, status da correspondência, tipo de entidade Bitrix e etapa atual do funil. Os filtros disponíveis são período, BU e status de correspondência.

## Evidência de validação

Na prévia autenticada, com o intervalo 01–10/09/2026, a auditoria carregou junto à aba Negócios e retornou 555 contatos RD únicos e 615 eventos qualificados. No Bitrix24, a mesma leitura mostrou 541 IDs técnicos de Lead criados, dos quais 476 têm `RD Station = sim`, reproduzindo o total exibido no funil comercial. O card também destaca 83 IDs técnicos sem BU reconhecida e, dentro deles, 27 com `RD Station = sim`; ambos permanecem incluídos nos totais gerais. A diferença fica visível na lista, com 70 correspondências como Lead, 3 somente como Contato, 454 sem correspondência e 28 com múltiplos registros. Esses totais são de auditoria e não devem ser interpretados como atribuição automática de origem.

O filtro de situação **Não encontrado** foi validado na sessão autenticada: a lista passou a exibir somente linhas sem correspondência no Bitrix24, mantendo os cards consolidados do período como contexto de leitura.
