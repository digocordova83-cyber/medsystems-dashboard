# Auditoria de leads RD Station ↔ Bitrix24

## Objetivo

A aba **Negócios** contém uma auditoria protegida por login do Dashboard. O universo do funil é formado pelos contatos qualificados no RD Station localizados na base do Bitrix24: correspondências únicas entram uma vez e, em casos múltiplos, cada **Lead técnico** candidato entra no funil como registro distinto.

## Regra de leitura

| Métrica | Regra aplicada |
|---|---|
| Contatos RD | Contato único com ao menos uma conversão no período cuja origem está entre as fontes permitidas e que não é importação. |
| Eventos RD | Todas as conversões qualificadas dos contatos no período. |
| Universo do funil | Correspondências únicas mais cada Lead técnico candidato de uma correspondência múltipla no Bitrix24. |
| Correspondência | E-mail exato normalizado tem prioridade. Sem e-mail correspondente, é usado nome normalizado. Casos múltiplos ficam sinalizados na auditoria e cada candidato do tipo Lead é contado no funil. |
| Etapa do funil | Etapa atual de cada Lead Bitrix incluído. Quando a correspondência é somente Contato, a linha é auditável, mas não entra no funil por não ter etapa de Lead. |
| Leads técnicos Bitrix | Métrica de referência do CRM; não define mais o universo do funil. |

## Lista protegida

A lista rolável apresenta, somente em sessão autenticada, nome, e-mail, telefone, BU, data e origem da conversão RD, status da correspondência, tipo de entidade Bitrix e etapa atual do funil. Os filtros disponíveis são período, BU e status de correspondência.

## Evidência de validação

Na prévia autenticada, com o intervalo 01–10/09/2026, a auditoria carregou junto à aba Negócios e retornou **555 contatos RD únicos** e **615 eventos qualificados**. A busca no Bitrix24 encontrou **373 contatos com correspondência única**: **370 como Lead** e **3 somente como Contato**. Existem ainda **88 contatos com múltiplos registros**, que reúnem **276 Leads técnicos candidatos**. Esses Leads foram incluídos no funil por solicitação do usuário, totalizando **649 Leads RD → Bitrix**. Os filtros de Pipeline/BU também somam 649: 429 BeautySystems, 124 MedSystems, 41 no pipeline 20889, 33 Aeskins, 2 Advance e 20 sem pipeline reconhecido. Os 94 não encontrados e os 3 contatos sem Lead seguem somente na auditoria. O Bitrix24 possui 541 IDs técnicos criados no período como métrica de referência separada.

O filtro de situação **Não encontrado** foi validado na sessão autenticada: a lista passou a exibir somente linhas sem correspondência no Bitrix24, mantendo os cards consolidados do período como contexto de leitura. A etapa atual e os filtros comerciais vêm da entidade encontrada no CRM; o número de contatos qualificados do RD é preservado como coorte do funil.

O snapshot diário de 10/09 foi recalculado com a versão `rd_bitrix_multi_v1`, preservando **contatos RD únicos** e **Leads técnicos Bitrix** como métricas separadas. O agendamento existente não foi alterado.

## Registros múltiplos

Quando a auditoria identifica mais de um candidato para o mesmo contato RD Station, a lista protegida mostra **todos os candidatos Bitrix24** associados à chave de busca ativa. Cada candidato exibe tipo de entidade, ID técnico, nome, e-mail, telefone, etapa atual — quando for Lead — e data de criação. Cada candidato do tipo **Lead** entra no funil como registro técnico distinto; candidatos apenas do tipo Contato continuam visíveis apenas para auditoria.

O filtro **Múltiplos registros** foi validado na sessão autenticada com duas correspondências candidatas exibidas na mesma linha de auditoria. Os dados pessoais permanecem restritos ao Dashboard autenticado e não são registrados nesta documentação.

Na validação visual final, os KPIs da auditoria mostraram 555 contatos RD, 615 eventos qualificados, 373 correspondências únicas, 276 Leads candidatos de casos múltiplos e 541 Leads técnicos Bitrix24 como referência. O funil e seus filtros comerciais carregaram 649 Leads técnicos, e o filtro de múltiplos preservou a lista de candidatos para revisão.
