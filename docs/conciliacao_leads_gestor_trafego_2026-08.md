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

## Atualização de 19/08 — Medsystems

O gestor reportou **422 leads** até 19/08/2026. Pelo documento de integração, a composição usa: (1) leads RD Station recebidos em tempo real por webhook e com UTM, (2) Meta Instant Forms e (3) conversas de Click-to-WhatsApp transformadas em leads sintéticos quando a flag `syncs_whatsapp` está habilitada.

| Componente | Evidência disponível | Valor |
|---|---|---:|
| Meta Instant Forms | API Meta, `actions_leadgen_grouped`, 01 a 19/08 | 0 |
| Conversas Meta iniciadas | API Meta, `actions_onsite_conversion_messaging_conversation_started_7d`, 01 a 19/08 | 32 |
| Leads RD com UTM no dashboard atual | Segmentação BRRO, 01 a 17/08 | 356 |
| Leads RD com UTM necessários para fechar o total do gestor | `422 - 32 - 0` | 390 |
| Diferença ante a coleta BRRO atual | `390 - 356` | 34 |

A composição **mais provável** é `390` leads RD com UTM via webhook + `0` Instant Forms + `32` leads sintéticos de WhatsApp = `422`. O salto de 34 é compatível com conversões de 18 e 19/08, porque o webhook do gestor é em tempo real enquanto a coleta BRRO local ainda termina em 17/08. Essa fórmula só se torna confirmada com acesso de leitura à tabela `leads` do Supabase do gestor ou a uma exportação dela, além da confirmação da flag `syncs_whatsapp` para Medsystems.

## Atualização de 21/08 — totais informados pelo gestor

Após a sincronização da segmentação BRRO e dos eventos RD Station até 20/08, o gestor informou **451** leads para Medsystems e **500** para BeautySystems. A comparação abaixo é mantida como conciliação de metodologias, e não como substituição automática dos indicadores auditados por API.

| Marca | Total informado pelo gestor | RD Station API: primeiro contato com UTM até 20/08 | Diferença | Diferença sobre o total do gestor |
|---|---:|---:|---:|---:|
| Medsystems | 451 | 442 | 9 | 1,99% |
| BeautySystems | 500 | 494 | 6 | 1,20% |

O recorte agora está próximo, mas não é idêntico. A API do dashboard conta cada contato uma única vez pelo seu primeiro evento com UTM no período, enquanto o gestor pode usar o webhook em tempo real, um horário de extração diferente ou regras adicionais de deduplicação e inclusão. A diferença de 15 leads não pode ser atribuída a uma causa única sem o identificador técnico dos registros ou uma exportação do relatório do gestor.

> Os valores de 451 e 500 permanecem registrados como números externos. O painel mantém 442 e 494 como métricas RD-only auditáveis até que o de-para por identificador seja disponibilizado.
