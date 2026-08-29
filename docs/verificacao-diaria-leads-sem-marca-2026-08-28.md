# Verificação diária simples — leads sem marca

A rotina diária das 08h BRT foi atualizada para incluir uma seção **Leads sem marca** no resumo D-1, sem criar fila persistente ou um segundo agendamento.

## Universo verificado

| Critério | Regra |
|---|---|
| Entidade | Lead Bitrix24 |
| Título | `Oportunidade do RD Station` |
| Classificação comercial | `UF_CRM_1744808620 = Tráfego Pago` |
| Campo de marca | Pipeline de Vendas `UF_CRM_1739195085` |
| MedSystems | Código `15391` |
| BeautySystems | Código `15395` |
| Sem marca | Qualquer outro código ou valor ausente |

O resumo informará os casos novos do D-1 e o acumulado do mês até D-1, agrupados por pipeline, campanha e origem. Campanhas usam `UTM_CAMPAIGN` e o payload RD embutido como fallback, conforme a regra existente do dashboard. Valores `null` e `undefined` permanecem ausentes.

O pipeline `20889` (`Consumíveis`) e a campanha `medical-dsb-conversao-lead-ads` são destacados como **mapeamento pendente**, sem atribuição automática de BU até a confirmação do significado de DSB.

## Validação

A consulta agregada confirmou que o campo correto do pipeline é `UF_CRM_1739195085`. Aplicando o universo comercial do dashboard ao período de 01 a 24/08/2026, foram observados 19 registros de Tráfego Pago no pipeline `20889`, todos contendo o sinal da campanha DSB no payload. Esse total não substitui os 14 casos do feedback, pois o recorte e o momento da extração são diferentes; a rotina passará a reportar o número atualizado de cada D-1.
