# Auditoria de leads RD Station ↔ Bitrix24

## Objetivo

A aba **Negócios** contém uma auditoria protegida por login do Dashboard. O universo do funil é formado pelos contatos únicos qualificados no RD Station que possuem uma correspondência única na base do Bitrix24; assim, o mesmo conjunto de contatos é usado na leitura RD e na leitura do CRM.

## Regra de leitura

| Métrica | Regra aplicada |
|---|---|
| Contatos RD | Contato único com ao menos uma conversão no período cuja origem está entre as fontes permitidas e que não é importação. |
| Eventos RD | Todas as conversões qualificadas dos contatos no período. |
| Universo do funil | Contatos RD qualificados no período com correspondência única no Bitrix24. |
| Correspondência | E-mail exato normalizado tem prioridade. Sem e-mail correspondente, é usado nome normalizado. Mais de um registro compatível permanece como múltiplo e não integra o funil. |
| Etapa do funil | Etapa atual do Lead Bitrix. Quando a correspondência é somente Contato, a linha é auditável, mas fica sem etapa de Lead. |
| Leads técnicos Bitrix | Métrica de referência do CRM; não define mais o universo do funil. |

## Lista protegida

A lista rolável apresenta, somente em sessão autenticada, nome, e-mail, telefone, BU, data e origem da conversão RD, status da correspondência, tipo de entidade Bitrix e etapa atual do funil. Os filtros disponíveis são período, BU e status de correspondência.

## Evidência de validação

Na prévia autenticada, com o intervalo 01–10/09/2026, a auditoria carregou junto à aba Negócios e retornou **555 contatos RD únicos** e **615 eventos qualificados**. A busca no Bitrix24 encontrou **373 contatos com correspondência única**: **370 como Lead** e **3 somente como Contato**. O funil principal passou a usar exatamente esses **373** contatos; nele, os filtros de Pipeline/BU também somam 373, com 256 em BeautySystems, 80 em MedSystems e 37 sem BU reconhecida. Permanecem na lista para auditoria 94 não encontrados e 88 com múltiplos registros, sem inclusão no funil. O Bitrix24 possui 541 IDs técnicos de Lead no período apenas como referência de CRM; essa métrica não define o universo atual.

O filtro de situação **Não encontrado** foi validado na sessão autenticada: a lista passou a exibir somente linhas sem correspondência no Bitrix24, mantendo os cards consolidados do período como contexto de leitura. A etapa atual e os filtros comerciais vêm da entidade encontrada no CRM; o número de contatos qualificados do RD é preservado como coorte do funil.

Os filtros de Pipeline/BU também foram validados no mesmo recorte: **256 BeautySystems**, **80 MedSystems** e **37 sem BU reconhecida** somam os **373 contatos** do funil. O snapshot diário de 10/09 foi recalculado com a versão `rd_bitrix_name_v1`; o agendamento existente não foi alterado.
