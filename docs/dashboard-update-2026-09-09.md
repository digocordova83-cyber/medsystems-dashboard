# Atualização do dashboard — corte de 09/09/2026

## Escopo e regra de leads

O dashboard foi atualizado manualmente em 10/09/2026, com dados operacionais até o fim de 09/09/2026 no horário de Brasília. A aba de Negócios preserva a regra **Bitrix24 com o campo oficial `RD Station = sim`**, sem filtros por título, origem, UTM, mídia paga ou match externo. Cada ID técnico de lead é contado uma única vez. A atribuição de BU é feita exclusivamente pelo Pipeline de Vendas.

| Universo Bitrix24 RD Station = sim | IDs técnicos | Observação |
|---|---:|---|
| MedSystems — pipeline 15391 | 168 | BU atribuída pelo pipeline |
| BeautySystems — pipeline 15395 | 248 | BU atribuída pelo pipeline |
| Não atribuído — pipeline 20889 | 23 | Sem inferência de BU |
| Não atribuído — pipeline 18811 | 1 | Sem inferência de BU |
| Não atribuído — sem pipeline | 2 | Sem inferência de BU |
| **Total** | **442** | 416 atribuídos e 26 não atribuídos |

## Cobertura por fonte

| Fonte | Atualização realizada | Cobertura confirmada |
|---|---|---|
| RD Station MedSystems | Contatos e conversões reprocessados | 30 eventos em 09/09 |
| RD Station BeautySystems | Contatos e conversões reprocessados | 25 eventos em 09/09 |
| Bitrix24 — leads | Carga de 01–09/09 conciliada | 499 registros brutos importados no período; universo de 442 com RD Station = sim |
| Bitrix24 — negócios | Negócios com fechamento em 09/09 sincronizados por ID e detalhe completo | 19 negócios fechados no dia carregados para o CRM local |
| Google Ads | Windsor.ai, duas contas oficiais | 5 campanhas MedSystems e 5 BeautySystems em 09/09 |
| Meta Ads | Windsor.ai, duas contas oficiais | 11 campanhas MedSystems e 11 BeautySystems em 09/09 |
| Publya | Sincronização oficial de programática e Push | 2 linhas de campanha em 09/09; última data disponível confirmada em 09/09 |

## Mídia e resultado comercial disponíveis

O investimento Google + Meta acumulado de 01–09/09 é de R$ 56.119,65: R$ 30.655,50 em MedSystems e R$ 25.464,15 em BeautySystems. A atualização de 09/09 adicionou R$ 1.699,95 para MedSystems e R$ 1.722,99 para BeautySystems. A Publya permanece com gasto financeiro igual a zero no retorno da fonte; portanto, seu custo é exibido como não disponível e não compõe CPL.

No mesmo corte, os negócios ganhos nos pipelines comerciais oficiais somam 15 MedSystems, R$ 2.997.815,96, e 13 BeautySystems, R$ 2.343.000,00. O total comercial é de 28 negócios ganhos e R$ 5.340.815,96. A leitura de ganhos continua independente do funil de leads, pois não há vínculo técnico de atribuição suficiente para transformar esse valor em conversão de marketing.

## Observações operacionais

O snapshot diário de 09/09 registrou zero novos IDs dentro da regra RD Station = sim. Os leads registrados no Bitrix24 nessa janela não traziam o valor `1` no campo oficial no momento da sincronização; a regra não foi flexibilizada. Isso não altera o acumulado mensal de 442 IDs técnicos. A atualização não modificou agendamentos nem critérios de coleta recorrente.
