# Conciliação de leads — relatório do gestor de tráfego e dashboard

## Objetivo

Este registro distingue o número de leads reportado pelo gestor de tráfego do indicador atualmente adotado no dashboard. Os dois indicadores têm finalidades diferentes e não devem ser somados nem substituídos entre si sem uma fonte comum de evidência.

## Metodologia declarada pelo gestor

> O documento recebido descreve um painel que registra **leads do RD Station com UTM**, **Meta Instant Forms** e, quando habilitado, **conversas de Click-to-WhatsApp transformadas em leads sintéticos**.

| Componente | Regra declarada | Condição para entrar no relatório de mídia |
|---|---|---|
| RD Station | Conversão recebida por webhook | Deve carregar UTM |
| Meta Instant Forms | Lead retornado pela API Meta | Entra como formulário nativo |
| Click-to-WhatsApp | Conversa iniciada registrada como lead sintético | Somente se a sincronização de WhatsApp estiver habilitada |

Essa metodologia explica por que o relatório recebido indicou **379** leads para Medsystems e **446** para BeautySystems: o número não representa apenas uma métrica padrão de conversão das plataformas nem somente contatos únicos do RD Station.

## Critério adotado no dashboard

Por decisão operacional posterior, o dashboard usa apenas o componente comprovável no banco atual: **contatos distintos do RD Station com UTM válida e e-mail único**. As UTMs são lidas da landing page ou do campo `traffic_source` decodificado do evento RD.

| Marca | Leads RD com UTM | Chegadas confirmadas ao Bitrix24 | Corte |
|---|---:|---:|---|
| Medsystems | 356 | 58 | 01 a 17/08/2026 |
| BeautySystems | 415 | 63 | 01 a 17/08/2026 |

A chegada ao Bitrix24 só é contabilizada quando existe e-mail único nas duas fontes e um lead Bitrix24 criado depois do primeiro evento RD com UTM correspondente. Esse critério evita incluir contatos preexistentes ou matches ambíguos.

## Diferença que permanece

O relatório do gestor contempla fontes Meta adicionais que não estão armazenadas na base atual como registros individuais equivalentes. Por isso, **379** e **446** não são usados como substitutos dos indicadores RD-only. Para reproduzi-los automaticamente, seria necessário integrar, por API, a tabela de leads do painel do gestor ou as fontes individuais de Instant Forms e de WhatsApp sintético com a regra de opt-in comprovada.

## Limite de evidência

O RD Station retorna os eventos e suas UTMs, mas não retorna a composição interna dos filtros de origem da segmentação BRRO. Assim, o dashboard não presume que filtros como origem ou exclusão de Importação tenham sido aplicados; o filtro efetivamente comprovado é a presença de UTM no evento.
