# Primeira coleta Publya — 28/08/2026

## Status

O token permanente foi obtido em uma única troca e armazenado criptografado no banco. A primeira sincronização consultou a API Publya v2 para o período de 01/08/2026 a 27/08/2026 e retornou quatro campanhas, das quais duas são programáticas em DV360: `B2B` e `B2B - Geolocalização`.

## Resultado programático auditado

| Indicador | Valor canônico |
|---|---:|
| Investimento | R$ 9.678,05 |
| Impressões | 610.996 |
| Cliques | 1.077 |
| CTR | 0,176% |
| CPM | R$ 15,84 |
| Viewability | 79,64% |

## Qualidade do dado

A API retornou os mesmos valores de investimento, impressões, cliques, CTR, CPM, CPC e viewability para as duas campanhas DV360. O dashboard preserva as duas linhas para auditoria, mas soma apenas uma ocorrência nos KPIs para evitar inflação. O campo `reach` também alternou entre as campanhas em chamadas sucessivas, embora as demais métricas permanecessem idênticas. Por isso, o alcance não deve ser tratado como confiável enquanto a Publya não esclarecer o comportamento.

A rota diária de DV360 retornou apenas CPM, CPC, CPV, CPA, viewability, eCPCL e conversões. Impressões, cliques, investimento e alcance não foram disponibilizados por dia; o dashboard mantém a evolução diária como indisponível em vez de estimar valores.

## Verificação visual

A aba Programática carregou em prévia autenticada com filtros de 01/08 a 27/08, duas campanhas DV360, KPIs, ranking de portais, formatos, criativos, tabela de campanhas e avisos metodológicos. Google Ads e Meta Ads retornados pela mesma conta Publya permanecem excluídos da aba para evitar mistura com as abas específicas de mídia.
