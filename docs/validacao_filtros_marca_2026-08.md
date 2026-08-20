# Validação dos filtros de marca — agosto de 2026

## Escopo e regra aplicada

As abas analíticas recebem `brand=medsystems` ou `brand=beautysystems` e usam a conta RD Station como critério principal. O filtro individual retornou somente os totais da conta selecionada:

| Filtro | Contatos convertidos | Leads com UTM | Período RD |
|---|---:|---:|---|
| Medsystems | 635 | 356 | 01 a 17/08/2026 |
| BeautySystems | 2.458 | 415 | 01 a 17/08/2026 |

## Sinais de UTM divergentes

O teste revelou UTMs que citam explicitamente a outra marca dentro da conta selecionada. Esses registros não são apagados nem reassociados: eles passam a ser exibidos no bloco **Sinais divergentes da conta**, fora dos rankings principais de campanhas e eventos.

> Exemplo de regra: uma campanha com `bts` ou `beautysystems` encontrada na conta Medsystems é tratada como divergência de UTM; uma campanha com `medical`, `medsystems` ou `med` encontrada na conta BeautySystems recebe o mesmo tratamento.

## Bitrix24

Os leads armazenados no Bitrix24 não têm marca estruturada. Sob filtro individual, os blocos de leads, origem e UTM ficam indisponíveis para não apresentar o consolidado como se pertencesse à marca. Negócios, perdas e descartes continuam filtrados pelo campo de marca confirmado.

## Testes realizados

As respostas dos endpoints protegidos de RD Station foram verificadas individualmente para as duas marcas. A tipagem e os testes de normalização/classificação de UTM também foram executados após a correção.
