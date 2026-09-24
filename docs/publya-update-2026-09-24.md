# Atualização da Programática — Publya | 24/09/2026

## Escopo

A aba **Programática** do dashboard MedSystems foi atualizada a partir do consolidado oficial da Publya informado para o cliente: [relatório consolidado MedSystems](https://portal.publya.com/report/client/medsystems/3961a4cc-4f2b-48f0-9a60-abf1c13437aa). A carga foi executada em 24/09/2026, com corte de dados até **23/09/2026**, e incluiu os sete reports de campanha listados no consolidado, além do report separado de Push.

## Reports importados

|   ID | Tipo                 | Objetivo                 | Período de vigência | URL oficial                                                                                           |
| ---: | -------------------- | ------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------- |
| 7058 | PMAX                 | Conversões               | 25–31/08/2026       | [abrir](https://portal.publya.com/report/campaign/medsystems/v2/0325c3c0-b079-4ef3-96c2-3d32d98152d8) |
| 7069 | Meta                 | Geração de cadastros     | 26–31/08/2026       | [abrir](https://portal.publya.com/report/campaign/medsystems/v2/3aa78e35-98c9-4815-a2d0-a852ce09944f) |
| 7059 | Programática Display | Conversões               | 25–26/08/2026       | [abrir](https://portal.publya.com/report/campaign/medsystems/v2/4b357f73-70d6-4737-824b-80579caaff6b) |
| 7083 | Programática Display | Alcance / geolocalização | 27–29/08/2026       | [abrir](https://portal.publya.com/report/campaign/medsystems/v2/114f5f44-0df7-4752-8155-093f03cb96e9) |
| 7144 | Meta                 | Geração de cadastros     | 02–30/09/2026       | [abrir](https://portal.publya.com/report/campaign/medsystems/v2/a1dc6ee3-b2b7-4883-a0d7-e005e15ccbf3) |
| 7145 | PMAX                 | Conversões               | 02–30/09/2026       | [abrir](https://portal.publya.com/report/campaign/medsystems/v2/9ba1213d-0f83-4dd3-887a-09c5e00c02d9) |
| 7292 | Programática Display | Conversões               | 14–30/09/2026       | [abrir](https://portal.publya.com/report/campaign/medsystems/v2/2ef1abab-fa21-4afb-ad50-808d098b11dc) |
| Push | Push Notification    | Disparos e cliques       | 27–29/08/2026       | [abrir](https://push.publya.com/medsystems/b2b/xr50xt2cwdhc)                                          |

## Indicadores carregados

| Período                 | Investimento | Impressões | Alcance reportado | Cliques | Leads | Conversões | Push                                     |
| ----------------------- | -----------: | ---------: | ----------------: | ------: | ----: | ---------: | ---------------------------------------- |
| Agosto/2026             | R$ 63.915,20 |    984.254 |            75.665 |  16.496 |    89 |         96 | 6.768 disparos e 28 cliques; R$ 6.694,36 |
| Setembro/2026 até 23/09 | R$ 34.118,09 |  1.219.480 |           218.999 |   2.309 |   264 |        266 | Sem entrega Push no período              |

Os totais acima são os **KPIs canônicos do dashboard**. Em agosto, os reports 7059 e 7083 retornaram métricas de entrega idênticas para Programática Display; por isso, uma ocorrência é mantida nos KPIs para evitar dupla contagem, enquanto os dois reports continuam visíveis individualmente. O alcance é apresentado como retornado pela Publya e não como pessoas deduplicadas entre reports.

## Ajustes de produto e metodologia

O catálogo de filtros passou a mostrar os sete reports de campanha e o Push. Os três URLs novos (7144, 7145 e 7292) foram adicionados ao catálogo oficial para abertura direta. O agregador agora aplica a vigência cadastrada de cada report ao período selecionado: os reports de agosto não contaminam o fechamento de setembro e os reports iniciados em setembro não entram no fechamento de agosto. A API continua sendo a fonte primária; nenhuma métrica ausente foi estimada.

A camada visual também foi atualizada para deixar explícito que a aba contém **sete reports B2B + Push**, e o contador de resultados informa quantos reports estão ativos no recorte selecionado. Formatos, criativos, portais e estratégias continuam sendo apresentados quando o report selecionado retorna essas dimensões.

## Validação

A carga foi executada para agosto (01–31/08) e setembro (01–23/09), com sete campanhas retornadas em cada sincronização. Após a atualização do agregador, foram aprovados **36 arquivos de teste e 118 testes**, a checagem TypeScript e o build de produção. A validação autenticada da aba confirmou os filtros, os links dos reports e os indicadores por campanha.

> **Limitação:** investimento, alcance, impressões, cliques, leads e conversões são métricas da Publya e não equivalem automaticamente a contatos únicos no RD Station ou a Leads únicos no Bitrix24. A atribuição comercial continua sendo auditada separadamente pelo cruzamento RD Station → Bitrix24.
