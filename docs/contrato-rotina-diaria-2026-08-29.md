# Contrato operacional da rotina diária — 29/08/2026

## Agendamento

| Rotina | Horário | Estado | Última execução validada |
|---|---|---|---|
| Atualização geral MedSystems | 08h BRT (`0 0 11 * * *`) | Ativa | 29/08/2026 às 11h02 UTC |
| Publya / Programática | 08h BRT (`0 0 11 * * *`) | Ativa | 29/08/2026 às 11h02 UTC |

## Contrato de dados

A rotina geral preserva o corte D-1 até 23h59 de Brasília, as quatro contas oficiais de mídia em BRL, o nível campanha e a chave canônica `plataforma + conta + data + campaign_id`, com upsert e seleção da versão mais recente. RD Station e Bitrix24 mantêm as regras atuais de marca, origem, funil e atribuição.

A seção **Leads sem marca** usa somente leads Bitrix24 com `TITLE = Oportunidade do RD Station` e `UF_CRM_1744808620 = Tráfego Pago`. A marca é reconhecida exclusivamente pelos códigos `15391` e `15395` do campo `UF_CRM_1739195085`. Outros códigos permanecem como mapeamento pendente.

Campanha prioriza `UTM_CAMPAIGN`; o payload RD em `UF_CRM_1778601092663` é apenas fallback. Valores ausentes, `null` e `undefined` não são promovidos a informação válida. O resumo informa casos novos D-1 e acumulado do mês, agrupados por pipeline, campanha e origem, sem dados pessoais.

## Validação atual

No acumulado de agosto até 28/08/2026, a consulta encontrou 20 leads comerciais sem BU reconhecida: 19 associados ao sinal `medical-dsb-conversao-lead-ads` e 1 ao sinal `medical-institucional-negocios-conversao-lead-ads`. Todos usam pipeline `20889`, rótulo `Consumíveis`. Não surgiram casos novos em 28/08. DSB permanece pendente de confirmação de significado e BU.

O valor direto de `UTM_CAMPAIGN` veio ausente nesses registros; a identificação da campanha aparece em `SOURCE_DESCRIPTION`/payload, portanto deve ser apresentada como fallback e não como UTM direta.
