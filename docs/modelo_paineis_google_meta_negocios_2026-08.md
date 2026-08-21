# Modelo dos painéis Google Ads, Meta Ads e Negócios

## Intervalo padrão

Os três painéis usam **01/08/2026 até a última data disponível da fonte** como estado inicial, correspondente ao mês corrente do projeto. O usuário poderá alterar as datas inicial e final; o servidor valida o formato, impede intervalos invertidos e limita a consulta ao período armazenado.

| Painel | Campo temporal principal | Cobertura atual |
|---|---|---|
| Google Ads | `reportDate` no nível campanha | até 19/08/2026 |
| Meta Ads | `reportDate` no nível campanha | até 19/08/2026 |
| Negócios — leads | `DATE_CREATE` do lead | até 19/08/2026 |
| Negócios — ganhos | `CLOSEDATE` do negócio | conforme negócios sincronizados; somente vínculos exatos por `LEAD_ID` entram nos filtros cruzados |

## Google Ads e Meta Ads

Os gráficos de **Investimento** e **Leads** usam registros no nível de campanha, evitando somar novamente linhas de anúncios. A distribuição de verba, o CPL e as hipóteses de monitoramento também usam o nível de campanha. O filtro de campanha recalcula KPIs, séries diárias e rankings.

Na Meta, “criativo ativo” significa `effective_status = ACTIVE` no snapshot Windsor.ai de **20/08/2026**. O status é cruzado com os anúncios persistidos pelo ID exato. Links de prévia oficiais são exibidos quando disponíveis. As métricas históricas de anúncio podem ter cobertura menor que as métricas de campanha e isso será sinalizado na interface.

## Negócios

A visão continua restrita a leads com título exato **Oportunidade do RD Station** e exclui a origem estruturada Evento. Os filtros de Pipeline de Vendas, responsável, Informações da fonte, etapa, posição e produto usam os valores reais armazenados no lead e atualizam simultaneamente todas as distribuições.

Negócios ganhos são filtrados pela data `CLOSEDATE` e entram na análise cruzada somente quando `LEAD_ID` aponta para um lead elegível no mesmo conjunto de filtros. Ganhos sem `LEAD_ID` permanecem contabilizados como **não vinculáveis** e não recebem origem presumida.

## Limites de interpretação

“Leads” nos painéis Google e Meta são os resultados retornados pelas respectivas plataformas, não equivalem automaticamente aos leads únicos do RD Station. Recomendações de mídia aparecem como hipóteses de monitoramento; nenhuma campanha será pausada, alterada ou terá orçamento redistribuído automaticamente.
