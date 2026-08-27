# Relatório executivo — RD Station

## Parâmetros

**Períodos:** julho/2026 fechado (01–31/07) versus agosto/2026 MTD (01–26/08).

**Fonte única:** tabela de eventos de conversão do RD Station, separada por conta Medsystems e BeautySystems.

**Regra aplicada conforme a documentação enviada:** cada conversão chega por webhook; contatos são deduplicados por conta e identificador do contato; leads de mídia paga são os contatos únicos cujo primeiro evento com UTM comprovada contém `utm_source`, considerando campos diretos, `traffic_source` decodificado e parâmetros da landing page. Leads orgânicos e diretos não entram na contagem de mídia paga.

**Limitação crítica:** a documentação informa que qualificação e perda ainda vivem no RD, mas não são sincronizadas de volta para este dashboard. Portanto, este relatório **não inventa MQL, SQL, investimento, CPL ou efeito de verba**. Essas métricas ficam fora do escopo RD-only quando não estão disponíveis na base persistida.

---

## Slide 1 — O que o RD Station comprova

**Headline:** O volume de contatos convertidos cresceu em agosto MTD, mas a cobertura de UTM caiu, principalmente em BeautySystems.

| Indicador RD Station | Julho fechado | Agosto MTD | Variação |
|---|---:|---:|---:|
| Contatos únicos com conversão | 1.773 | 3.875 | +118,6% |
| Contatos únicos com UTM | 862 | 944 | +9,5% |
| Cobertura UTM sobre contatos convertidos | 48,6% | 24,4% | -24,2 pp |
| Eventos de conversão | 1.773 | 4.154 | +134,2% |

**Leitura:** agosto trouxe mais contatos únicos e mais eventos, porém o crescimento ficou concentrado em conversões sem UTM identificada no recorte do primeiro evento. O RD não permite concluir, sozinho, que esse aumento veio de mídia paga ou que gerou MQL/SQL.

---

## Slide 2 — Evolução mês a mês no RD

**Visual:** gráfico de barras com Contatos únicos, Contatos com UTM e Eventos de conversão; ao lado, a taxa de cobertura de UTM.

| Métrica | Julho | Agosto MTD |
|---|---:|---:|
| Contatos únicos com conversão | 1.773 | 3.875 |
| Contatos com UTM comprovada | 862 | 944 |
| Eventos de conversão | 1.773 | 4.154 |
| Cobertura de UTM | 48,6% | 24,4% |

**Interpretação:** o volume bruto do RD cresceu mais rápido do que o universo com UTM. A diferença entre eventos e contatos em agosto também mostra recorrência de conversão: 4.154 eventos para 3.875 contatos únicos.

**Nota:** agosto é MTD até 26/08 e não deve ser comparado como mês fechado sem sinalização de janela.

---

## Slide 3 — Comparação por BU

| BU | Contatos jul | UTM jul | Cobertura jul | Contatos ago MTD | UTM ago | Cobertura ago | Leitura |
|---|---:|---:|---:|---:|---:|---:|---|
| Medsystems | 967 | 444 | 45,9% | 1.126 | 498 | 44,2% | Crescimento de contatos com cobertura UTM praticamente estável. |
| BeautySystems | 806 | 418 | 51,9% | 2.749 | 446 | 16,2% | Forte crescimento bruto, mas quase todo o incremento não está identificado por UTM. |
| **Total** | **1.773** | **862** | **48,6%** | **3.875** | **944** | **24,4%** | **Volume sobe; rastreabilidade relativa cai.** |

**Variações:** Medsystems cresceu 16,4% em contatos únicos e 12,2% em contatos com UTM. BeautySystems cresceu 241,1% em contatos únicos, mas apenas 6,7% em contatos com UTM; a cobertura caiu 35,7 pontos percentuais.

**Alerta gerencial:** o resultado de BeautySystems exige validação do tagging e do fluxo de captura antes de ser interpretado como crescimento de mídia paga.

---

## Slide 4 — O que está chegando identificado por UTM

**Universo:** agosto MTD, campos estruturados diretamente identificados no payload RD; o parser do dashboard também decodifica `traffic_source` e parâmetros da landing page.

| Origem / meio diretamente identificados | Contatos |
|---|---:|
| Facebook / cpc | 637 |
| Google / cpc | 133 |
| RD Station / email | 7 |
| ChatGPT / sem meio | 3 |
| Facebook / sem meio | 1 |
| Google / cpc com conflito de origem | 1 |

**Leitura:** entre os campos estruturados diretamente identificados, Facebook/cpc concentra o maior volume e Google/cpc aparece em segundo. A análise de campanha, conjunto e criativo só deve ser exibida quando o evento trouxer `utm_campaign`, `utm_content` ou `utm_id` comprovados.

**Não inferir:** a ausência de UTM direta não prova origem orgânica. O RD pode receber `traffic_source` codificado ou parâmetros de landing page; por isso, a regra do dashboard tenta decodificar os três formatos documentados.

---

## Slide 5 — MQL, SQL, verba e efeito: o que o RD não responde sozinho

**MQL→SQL:** não calculado. A base RD persistida para este dashboard registra conversões, contatos e UTMs, mas não traz uma sequência confiável de qualificação MQL/SQL.

**Lead→MQL:** não calculado. Não há um campo de passagem de estágio persistido no fluxo descrito pela documentação.

**Conversão por BU:** calculada no nível disponível do RD: contatos únicos convertidos e contatos únicos com UTM, separados por conta.

**Uso da verba:** não calculado no RD-only. Spend e custo pertencem às plataformas de mídia; a documentação informa que Meta e Google são ingestões separadas.

**Onde há efeito comprovado:** no aumento de contatos únicos e de eventos em agosto, não no efeito causal da verba. O principal sinal negativo é a queda de cobertura UTM, especialmente em BeautySystems.

**Conclusão:** antes de otimizar orçamento por SQL, é necessário manter o cruzamento com mídia/CRM ou passar a persistir no RD um campo de qualificação com histórico de mudança.

---

## Slide 6 — Resposta à Isa usando somente RD Station

**O que pode ser respondido agora:** o RD mostra 1.773 contatos únicos convertidos em julho e 3.875 em agosto MTD, crescimento de 118,6%. Contatos com UTM passaram de 862 para 944, crescimento de 9,5%. A cobertura de UTM caiu de 48,6% para 24,4%.

**O que não pode ser respondido com segurança usando apenas RD:** quanto foi investido antes versus agora; aumento de leads relacionado à verba; MQL→SQL; Lead→MQL; SQL por campanha; e efeito específico das campanhas de hyperlocal e push até 29/08. Esses pontos exigem mídia e/ou qualificação persistida.

**Recomendação de leitura para 29/08:** acompanhar diariamente, no RD, contatos únicos, contatos com UTM e cobertura de UTM por BU e campanha. Em paralelo, validar o tagging das campanhas hyperlocal e push. Só depois cruzar com Spend e SQL para atribuir efeito de verba.

**Fonte e corte:** RD Station sincronizado no dashboard até 26/08/2026; agosto MTD. Documento de parâmetro: `dashboard-leads-como-os-dados-sao-puxados.docx`.
