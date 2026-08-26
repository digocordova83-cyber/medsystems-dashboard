# Aba Negócios — funil de Tráfego Pago

## Universo-base

A aba usa somente leads Bitrix24 cujo campo estruturado `UF_CRM_1744808620` seja exatamente `Tráfego Pago`. O título do lead não é usado como prova de origem.

## Regras do funil

- **Lead:** registro pertencente ao universo-base no período selecionado.
- **MQL / Qualificado:** etapa atual em Primeiro Contato, Segundo Contato, Terceiro Contato, Relacionamento, Converter Lead ou Convertido; também inclui lead com negócio vinculado.
- **SQL / Oportunidade:** etapa atual em Relacionamento, Converter Lead ou Convertido; também inclui lead com negócio vinculado.
- **Negócio:** vínculo verificável por `LEAD_ID` e, quando válido e diferente de zero, `CONTACT_ID`.
- **Ganho:** negócio vinculado cuja semântica de etapa seja `S`.

O funil usa a etapa atual. Sem um histórico completo de transições, leads hoje descartados não são retroativamente contados em MQL ou SQL, mesmo que tenham passado por essas etapas.

## Atribuição

As UTMs diretas do lead têm prioridade. Na ausência delas, a análise usa o payload RD Station embutido no Bitrix24. A convenção observada nesta operação é:

- `utm_campaign`: campanha;
- `utm_content`: conjunto/grupo;
- `utm_term`: criativo;
- campos ausentes: `Não identificado`.

## Validação com dados reais

No recorte padrão de 01/08/2026 a 25/08/2026, a visão consolidada retornou 641 leads, 529 MQLs, 37 SQLs, 25 negócios vinculados e 1 negócio ganho com valor de R$ 259.000. O filtro Medsystems recalculou corretamente todo o painel para 143 leads, 108 MQLs, 11 SQLs e 7 negócios vinculados.

Foi removido um vínculo indevido causado por `CONTACT_ID = 0`, que multiplicava negócios e valores. O identificador zero agora é tratado como ausência de vínculo.
