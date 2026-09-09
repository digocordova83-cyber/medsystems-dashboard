# Report executivo — fonte de verdade do corte 08/09/2026

## Critério de leads

Universo: registros `entityType = lead` criados entre 01 e 08/09/2026 com o campo oficial Bitrix24 `UF_CRM_1738950899 = 1` (`RD Station = sim`). Não há filtros adicionais de título, UTM, origem ou evidência externa. BU definida somente pelo Pipeline de Vendas: `15391 = MedSystems`, `15395 = BeautySystems`; os demais permanecem não atribuídos.

| BU | Leads 01–08/09 | Leads em 08/09 |
|---|---:|---:|
| MedSystems | 173 | 6 |
| BeautySystems | 244 | 12 |
| Não atribuído | 25 | 2 |
| **Total** | **442** | **20** |

## Canais dentro do universo Bitrix24

| BU | Mídia paga | Evento | Orgânico | Referência | Não classificado | Total |
|---|---:|---:|---:|---:|---:|---:|
| MedSystems | 86 | 62 | 23 | 2 | 0 | 173 |
| BeautySystems | 195 | 0 | 37 | 6 | 6 | 244 |
| Não atribuído | 21 | 0 | 0 | 0 | 4 | 25 |

Classificação usada apenas como dimensão, nunca como filtro de inclusão. Campos usados: `UF_CRM_1744808620`, `SOURCE_DESCRIPTION`, `SOURCE_ID` e `UTM_MEDIUM`.

## Investimento Google + Meta via Windsor

Quatro contas oficiais, BRL, granularidade campanha, chave canônica por plataforma + conta + data + campanha.

| BU | Google | Meta | Total 01–08/09 | Investimento em 08/09 |
|---|---:|---:|---:|---:|
| MedSystems | R$ 3.424,36 | R$ 12.961,78 | R$ 16.386,14 | R$ 1.790,10 |
| BeautySystems | R$ 3.175,79 | R$ 10.281,74 | R$ 13.457,53 | R$ 1.588,51 |
| **Total** | **R$ 6.600,15** | **R$ 23.243,52** | **R$ 29.843,67** | **R$ 3.378,61** |

## Programática Publya

Cobertura até 08/09/2026. Duas campanhas técnicas com o mesmo nome `B2B - Setembro`: uma acumula 10.645 impressões, 255 cliques e 1 conversão; a outra acumula 24 conversões. Total operacional: 10.645 impressões, 255 cliques e 25 conversões. O custo financeiro permanece zero/indisponível na fonte e não entra no CPL.

## Etapas oficiais do Bitrix24 por BU

O slide 5 não exibirá `Histórico Lead Convertidos` e não exibirá valores de negócios ganhos. A soma das etapas visíveis pode ser menor que o universo da BU por essa exclusão editorial explícita.

| BU | Total | SDR | Eventos | Primeiro contato | Segundo contato | Terceiro contato | Relacionamento | Converter lead | Descartado | Descartado p/ MKT | Status convertido excluído |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| MedSystems | 173 | 16 | 35 | 57 | 6 | 5 | 0 | 0 | 42 | 7 | 5 |
| BeautySystems | 244 | 29 | 0 | 147 | 24 | 9 | 14 | 0 | 13 | 5 | 3 |
| Não atribuído | 25 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 20 |

## Negócios ganhos

Fechamentos com `STAGE_SEMANTIC_ID = S` e `CLOSEDATE` entre 01 e 08/09/2026. Pipelines comerciais: categoria 42 = MedSystems Vendas; categoria 57 = BeautySystems Negócios e Redes. Categoria 44 = MedSystems Faturamento, excluída para evitar duplicação de vendas.

| BU | Negócios ganhos | Valor de oportunidade |
|---|---:|---:|
| MedSystems | 15 | R$ 2.997.815,96 |
| BeautySystems | 12 | R$ 2.044.000,00 |
| **Total comercial** | **27** | **R$ 5.041.815,96** |

Em 08/09 não houve novo ganho nos dois pipelines comerciais. O pipeline de faturamento contém 45 registros e R$ 9.592.787,96 no período, mantidos fora do total comercial.
