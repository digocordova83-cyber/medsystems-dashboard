# QA — conciliação de leads

## Revisão autenticada

A aba **Leads** foi validada com perfil de cliente no ambiente de prévia. O carregamento exibiu corretamente o recorte padrão de 01/09/2026, 86 conversões na fonte, 75 contatos únicos, 73 registros com origem identificada, 13 com origem desconhecida, 74 contatos únicos correspondidos ao RD e 84 leads informados pelo gestor.

| BU | Fonte | Contatos únicos | Origem identificada | Origem desconhecida | Gestor | Diferença |
|---|---:|---:|---:|---:|---:|---:|
| MedSystems | 41 | 35 | 34 | 7 | 39 | +2 |
| BeautySystems | 45 | 40 | 39 | 6 | 45 | 0 |

A navegação lateral, os filtros de data, BU e canal, os cards, a tabela de campanhas e a seção metodológica estão visíveis. A interface preserva a BU declarada na fonte e não reatribui registros pelo prefixo da campanha.

## Validações pendentes nesta rodada

O filtro **MedSystems** atualizou os indicadores para 41 conversões, 35 contatos únicos, 34 registros com origem identificada, 7 com origem desconhecida, 35 contatos correspondidos no RD e benchmark 39, com diferença +2. A tabela de campanhas e os eventos também foram restritos à BU selecionada.

O filtro **Origem não identificada** atualizou os indicadores para 13 conversões e 13 contatos únicos, distribuídos em 7 MedSystems e 6 BeautySystems. O benchmark do gestor foi corretamente ocultado nesse recorte parcial, evitando comparar o total informado com apenas um canal.

A interface foi ajustada para ocultar a linha zerada da outra BU quando uma marca específica estiver filtrada. Permanece pendente a validação em largura mobile antes da publicação.

A captura pública em 390 × 844 confirmou a responsividade e legibilidade da tela de autenticação. A aba autenticada também foi renderizada em um viewport isolado de 390 × 844: cabeçalho, título, selos e card principal empilharam corretamente, sem corte horizontal. O banner inferior observado pertence ao ambiente de prévia e não ao aplicativo. A nota da comparação foi corrigida para informar que o benchmark geral não se aplica quando um canal específico está filtrado.

Após retornar ao filtro **Todos os canais**, os totais voltaram a 86 registros, 75 contatos únicos, 73 registros com origem identificada e benchmark 84. A inspeção até o final da página confirmou que a lista de eventos e o painel de metodologia permanecem legíveis, alinhados e sem sobreposição em desktop.
