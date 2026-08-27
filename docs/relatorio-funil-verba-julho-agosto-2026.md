# Relatório executivo — Funil, verba e conversão

## Parâmetros do estudo

**Título:** Lead → MQL → SQL: evolução por BU e relação com a verba

**Períodos comparados:** julho/2026 fechado (01–31/07) versus agosto/2026 MTD (01–26/08). Agosto não é mês fechado; por isso, o comparativo deve ser lido como avanço de ciclo, não como fechamento mensal definitivo.

**Universo do funil:** leads Bitrix24 criados no período, com `UF_CRM_1744808620 = Tráfego Pago`, segmentados pelos pipelines Medsystems e BeautySystems · Negócios e Redes.

**Definição operacional:** MQL = estágio atual Primeiro Contato ou posterior, conforme regra do dashboard; SQL = estágio atual Relacionamento, Converter Lead ou Convertido. O relatório usa estágio atual, pois não há histórico transicional completo persistido. A tabela de taxas é calculada sobre os estágios observados; negócios vinculados permanecem uma camada comercial separada no dashboard.

**Mídia:** Spend e platform leads da camada canônica do dashboard, deduplicada pela chave plataforma + conta + data + campanha. Valores em BRL.

---

## Slide 1 — A leitura executiva em 30 segundos

**Headline:** Agosto comprou mais volume de mídia e melhorou Lead→MQL, mas ainda não provou ganho proporcional em SQL.

**Indicadores-chave:**

| Indicador | Julho fechado | Agosto MTD | Variação |
|---|---:|---:|---:|
| Leads Bitrix24 de Tráfego Pago | 1.025 | 944 | -7,9% |
| MQL | 772 | 793 | +2,7% |
| SQL | 73 | 49 | -32,9% |
| Spend | R$ 23.093,51 | R$ 74.064,70 | +220,7% |
| Platform leads | 433 | 1.052 | +143,0% |
| Spend por platform lead | R$ 53,33 | R$ 70,40 | +32,0% |

**Leitura:** A expansão de mídia aparece claramente no topo da plataforma, mas não se converteu na mesma proporção em oportunidades SQL no CRM. O primeiro sinal positivo está na taxa Lead→MQL; o gargalo atual está entre MQL→SQL.

**Visual sugerido:** cinco cards de KPI e uma faixa de conclusão com “volume de mídia ↑ / SQL ↓”.

---

## Slide 2 — O que mudou de um mês para o outro

**Visual:** gráfico de barras agrupadas com Julho e Agosto MTD para Leads, MQL e SQL; ao lado, barras de Spend e platform leads.

**Dados para o gráfico:**

| Métrica | Julho | Agosto MTD | Leitura |
|---|---:|---:|---|
| Leads Bitrix24 de Tráfego Pago | 1.025 | 944 | O CRM recebeu menos leads no MTD, apesar do aumento de mídia. |
| MQL | 772 | 793 | O volume qualificado ficou ligeiramente acima de julho. |
| SQL | 73 | 49 | O volume de oportunidade caiu 32,9% no recorte atual. |
| Spend | R$ 23,1 mil | R$ 74,1 mil | A verba foi 3,2 vezes maior no MTD. |
| Platform leads | 433 | 1.052 | O volume de resultados de plataforma mais que dobrou. |

**Nota metodológica em destaque:** julho tem 31 dias e agosto considera 26 dias. Para decisão de orçamento, complementar este corte com o fechamento de agosto e com a análise diária; não projetar o mês inteiro a partir de uma média simples sem validar a cadência das campanhas.

---

## Slide 3 — Lead → MQL → SQL: onde o funil ganhou ou perdeu

**Visual:** dois funis horizontais, um por BU, com contagens e taxas; ao lado, matriz de variações em pontos percentuais.

**Medsystems:**

| Etapa | Julho | Agosto MTD | Variação de volume | Taxa no período atual |
|---|---:|---:|---:|---:|
| Lead | 267 | 225 | -15,7% | — |
| MQL | 191 | 159 | -16,8% | 70,7% de Lead→MQL |
| SQL | 27 | 11 | -59,3% | 6,9% de MQL→SQL |

**BeautySystems:**

| Etapa | Julho | Agosto MTD | Variação de volume | Taxa no período atual |
|---|---:|---:|---:|---:|
| Lead | 758 | 719 | -5,1% | — |
| MQL | 581 | 634 | +9,1% | 88,2% de Lead→MQL |
| SQL | 46 | 38 | -17,4% | 6,0% de MQL→SQL |

**Leitura:** Medsystems perdeu mais força no fundo do funil: MQL→SQL caiu 7,2 pontos percentuais. BeautySystems melhorou Lead→MQL em 11,5 pontos percentuais e reduziu o descarte, porém MQL→SQL também caiu 1,9 ponto percentual. Em ambas, o efeito positivo está mais próximo da qualificação inicial do que da geração de SQL.

---

## Slide 4 — Conversão de cada BU versus média

**Visual:** tabela comparativa com destaque de melhor taxa por etapa e barras de taxa.

**Média simples entre as duas BUs:**

| Taxa | Julho — Medsystems | Julho — BeautySystems | Média julho | Agosto — Medsystems | Agosto — BeautySystems | Média agosto |
|---|---:|---:|---:|---:|---:|---:|
| Lead→MQL | 71,5% | 76,6% | 74,1% | 70,7% | 88,2% | 79,4% |
| MQL→SQL | 14,1% | 7,9% | 11,0% | 6,9% | 6,0% | 6,5% |
| Lead→SQL | 10,1% | 6,1% | 8,1% | 4,9% | 5,3% | 5,1% |
| Descarte / Lead | 28,5% | 23,2% | 25,8% | 25,8% | 9,9% | 17,8% |

**Leitura:** a média simples mostra uma melhora de 5,3 pontos percentuais em Lead→MQL, mas uma queda de 4,5 pontos percentuais em MQL→SQL e de 3,0 pontos em Lead→SQL. O indicador de qualidade do topo melhorou; o indicador de passagem para oportunidade piorou.

**Comparação correta:** a média simples ajuda a comparar as BUs sem deixar BeautySystems dominar pelo maior volume. A taxa consolidada ponderada deve ser usada para medir o resultado total: Lead→MQL foi de 75,3% para 84,0%; MQL→SQL foi de 9,5% para 6,2%.

---

## Slide 5 — Uso da verba: onde está dando efeito

**Visual:** barras empilhadas de Spend por plataforma e quadro de eficiência.

| Mês | Google Ads | Meta Ads | Meta share do Spend | Platform leads | Spend por platform lead |
|---|---:|---:|---:|---:|---:|
| Julho | R$ 10.509,13 | R$ 12.584,38 | 54,5% | 433 | R$ 53,33 |
| Agosto MTD | R$ 14.570,50 | R$ 59.494,20 | 80,3% | 1.052 | R$ 70,40 |

**Por BU:**

| BU | Variação Spend | Variação platform leads | Variação Leads Bitrix24 | Indicativo |
|---|---:|---:|---:|---|
| Medsystems | +266,5% | +170,2% | -15,7% | Efeito no volume de mídia, ainda não comprovado no CRM/SQL. |
| BeautySystems | +181,5% | +117,8% | -5,1% | Efeito em Lead→MQL e descarte, sem ganho proporcional em SQL. |

**Leitura:** o aumento de verba foi concentrado em Meta Ads, que respondeu por 80,3% do Spend de agosto MTD. O indicador de plataforma cresceu, mas o custo por platform lead subiu 32,0%. Não há evidência suficiente neste corte para afirmar que o aumento de verba gerou mais SQL; o próximo teste deve conectar campanha/UTM a SQL e comparar qualidade, não apenas volume.

**Cuidado de interpretação Meta:** Spend e platform leads são métricas da plataforma. A decisão de distribuição deve considerar eficiência marginal e não somente médias agregadas; não recomendar pausar ou cortar uma campanha apenas por CPA médio sem avaliar a curva diária e o tipo de objetivo.

---

## Slide 6 — Resposta à Isa e plano de leitura

**Demandas trazidas pela Isa na conversa compartilhada:** retorno do relatório; comparação entre quanto era investido antes e quanto está sendo investido agora; comparação de leads do mês passado versus o mês atual, relacionando volume e verba; retorno com urgência; registro de que campanhas de hyperlocal e push foram programadas para rodar até 29/08.

**Resposta objetiva:** agosto MTD tem Spend 220,7% maior, platform leads 143,0% maiores e custo por platform lead 32,0% maior. No CRM, Leads Bitrix24 caíram 7,9%, MQL subiu 2,7% e SQL caiu 32,9%. Portanto, o aumento de investimento teve efeito comprovado em entrega de mídia e qualificação inicial, mas ainda não em SQL.

**Indicativos usados:** Spend canônico; platform leads; Leads Bitrix24 de Tráfego Pago; MQL; SQL; Lead→MQL; MQL→SQL; Lead→SQL; descarte por Lead; e Spend por platform lead. Atribuição de campanha só deve ser declarada quando houver UTM/identificador comprovado.

**Recomendação operacional como hipótese de teste:** acompanhar até 29/08 as campanhas de hyperlocal e push em uma leitura diária separando Medsystems e BeautySystems; comparar não apenas Leads Bitrix24, mas MQL→SQL e Lead→SQL por campanha. Não afirmar causalidade antes de haver volume e atribuição suficientes.

**Limitações:** agosto está incompleto; o funil usa estágio atual no Bitrix24, sem histórico transicional completo; platform leads não equivalem automaticamente a Leads Bitrix24; a base atual não permite atribuir todo SQL à verba sem vínculo de campanha/UTM.

**Fonte:** dashboard MedSystems, camada canônica de mídia e registros Bitrix24 sincronizados até 26/08/2026. Preparado em 27/08/2026.
