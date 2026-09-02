# Conciliação integrada ao Bitrix24 — 02/09/2026

## Decisão de produto

A base de referência enviada pelo cliente é utilizada exclusivamente no backend para localizar entidades do Bitrix24 por evidência verificável. Ela não é exibida como fonte paralela, não é somada ao CRM e não cria registros comerciais fictícios.

## Regra aplicada

O universo da aba Negócios contém apenas leads persistidos no Bitrix24. Um lead entra no funil quando o campo `UF_CRM_1744808620` está classificado como `Tráfego Pago` ou quando existe match inequívoco com a referência do mesmo período por UUID do RD Station, e-mail normalizado ou telefone normalizado. Quando o match identifica uma única BU, a marca conciliada é aplicada ao filtro `Pipeline / marca no CRM`; o pipeline original permanece no payload para auditoria.

## Resultado validado para 01/09/2026

| Indicador | Volume |
|---|---:|
| Leads criados no Bitrix24 no dia, todos os tipos | 84 |
| Universo anterior pelo campo Tráfego Pago | 50 |
| Universo conciliado no Bitrix24 | 52 |
| Recuperados por match fora da classificação paga | 2 |
| MedSystems no CRM conciliado | 11 |
| BeautySystems no CRM conciliado | 41 |

Os 52 registros recalculam o funil, MQL, SQL, responsáveis, estágios, campanhas, conjuntos e criativos. Os 84 leads totais informados pelo gestor não são usados diretamente porque incluem todas as entradas do dia no Bitrix24; o funil permanece restrito a evidência de mídia paga ou match individual.

## Interface

A seção separada `Fonte de referência × pessoas × CRM`, o botão de análise completa e a aba `Leads` foram removidos. Links antigos com `#leads` redirecionam para `#bitrix`. A metodologia de conciliação aparece dentro da aba Negócios.

## Validação

Foram aprovados nove testes focados, a checagem TypeScript e o build de produção. Na revisão autenticada, a navegação contém apenas Overview, Google Ads, Meta Ads, Programática, Negócios e Guia de dados; o recorte de 01/09 mostra 52 registros no Pipeline / marca, distribuídos em 11 MedSystems e 41 BeautySystems.
