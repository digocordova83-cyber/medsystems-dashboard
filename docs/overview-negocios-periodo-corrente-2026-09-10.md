# Validação do Overview e da aba Negócios — 10/09/2026

## Overview mensal

Na prévia autenticada, o Overview abriu com **setembro de 2026** selecionado por padrão e apresentou corte até **09/09/2026**, confirmando o comportamento de mês corrente com dados D-1. O seletor preservou os históricos de agosto e julho para consulta manual.

## Próxima validação

A aba **Negócios** abriu no intervalo de 01 a 09/09/2026 e confirmou os KPIs consolidados de 442 leads, 28 negócios ganhos e R$ 5,3 mi de valor ganho. A nova seção **“Negócios ganhos por campanha → conjunto → criativo”** foi validada visualmente: apresenta 28 ganhos e R$ 5.340.815,96, separados do funil de leads e identificados como UTMs do próprio negócio ganho. A tabela está legível, mas a predominância de valores genéricos como `APP`/`Não identificado` exige auditoria dos valores de UTM persistidos no CRM antes de interpretar a origem comercial.

## Correção do corte da aba Negócios

A captura que ainda mostrava 01–08/09 revelou que o fim do intervalo era calculado pelo relógio do navegador e gravado apenas na primeira montagem do componente. Assim, uma aba já aberta não avançava quando o corte diário era atualizado, e dispositivos com relógio/fuso diferente podiam divergir do corte operacional.

A aba passou a receber do servidor o intervalo padrão do mês corrente até D-1 em São Paulo. Ela reconsulta esse metadado ao retornar ao foco e a cada minuto; enquanto o usuário estiver no período padrão, o intervalo e os KPIs avançam juntos. Ao aplicar um intervalo manual, a seleção é preservada. O gráfico de evolução diária agora mantém todos os dias do recorte, incluindo 09/09 mesmo quando não houver entrada de novos IDs com RD Station = sim.

Em validação autenticada na prévia em 10/09/2026, a abertura padrão exibiu **01/09/2026 a 09/09/2026**, 442 leads, 28 ganhos e R$ 5,3 mi. Em seguida, a seleção manual de 01–08/09 foi aplicada e preservada, retornando 27 ganhos, o que confirma que os KPIs acompanham o intervalo efetivamente escolhido.

## Reprocessamento auditável de 09/09

Em 10/09/2026, a coleta de setembro foi reexecutada diretamente no Bitrix24 e retornou 499 leads no mês. Para a data de 09/09, a API retornou três leads criados, todos com o campo oficial `UF_CRM_1738950899` (RD Station) igual a `0`; nenhum recebeu o valor `1` (RD Station = sim). Portanto, a linha diária continua em zero por aplicação estrita da regra acordada, e não por omissão de data no gráfico.

O dashboard mantém o critério: incluir todos e apenas os IDs técnicos cujo campo oficial do Bitrix24 seja **RD Station = sim**, sem qualquer exclusão por título, origem, UTM, mídia ou cruzamento externo. A reimportação não encontrou registros elegíveis adicionais em 09/09, preservando o acumulado de 442 leads no intervalo 01–09/09.

## Cobertura de UTM em negócios ganhos

Uma auditoria agregada dos 28 negócios ganhos fechados de 01 a 09/09 encontrou `UTM_SOURCE = APP` e `UTM_CONTENT = APP` em todos os registros, com `UTM_MEDIUM`, `UTM_CAMPAIGN` e `UTM_TERM` nulos. Portanto, não existe campanha, conjunto ou criativo comercialmente identificável no próprio negócio para este corte. A interface trata `APP` como valor genérico e o expõe como **Não identificado**, sem atribuir receita a qualquer campanha, conjunto ou criativo.
