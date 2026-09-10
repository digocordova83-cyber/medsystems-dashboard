# Validação do Overview e da aba Negócios — 10/09/2026

## Overview mensal

Na prévia autenticada, o Overview abriu com **setembro de 2026** selecionado por padrão e apresentou corte até **09/09/2026**, confirmando o comportamento de mês corrente com dados D-1. O seletor preservou os históricos de agosto e julho para consulta manual.

## Próxima validação

A aba **Negócios** abriu no intervalo de 01 a 09/09/2026 e confirmou os KPIs consolidados de 442 leads, 28 negócios ganhos e R$ 5,3 mi de valor ganho. A nova seção **“Negócios ganhos por campanha → conjunto → criativo”** foi validada visualmente: apresenta 28 ganhos e R$ 5.340.815,96, separados do funil de leads e identificados como UTMs do próprio negócio ganho. A tabela está legível, mas a predominância de valores genéricos como `APP`/`Não identificado` exige auditoria dos valores de UTM persistidos no CRM antes de interpretar a origem comercial.

## Cobertura de UTM em negócios ganhos

Uma auditoria agregada dos 28 negócios ganhos fechados de 01 a 09/09 encontrou `UTM_SOURCE = APP` e `UTM_CONTENT = APP` em todos os registros, com `UTM_MEDIUM`, `UTM_CAMPAIGN` e `UTM_TERM` nulos. Portanto, não existe campanha, conjunto ou criativo comercialmente identificável no próprio negócio para este corte. A interface trata `APP` como valor genérico e o expõe como **Não identificado**, sem atribuir receita a qualquer campanha, conjunto ou criativo.
