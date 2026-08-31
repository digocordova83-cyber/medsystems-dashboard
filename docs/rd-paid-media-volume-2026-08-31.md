# Auditoria do volume de leads RD de mídia paga — D-1 30/08/2026

## Objetivo e corte

Esta nota registra o critério usado para atualizar o volume de leads no **Report executivo MedSystems + BeautySystems**. O cálculo foi executado por conta do RD Station, em `America/Sao_Paulo`, nos períodos comparáveis de **01–30/07/2026** e **01–30/08/2026**. A atualização D-1 de 30/08/2026 foi concluída antes do cálculo: MedSystems ficou com 2.091 contatos sincronizados na segmentação BRRO `19993961`, e BeautySystems com 3.365 contatos na segmentação BRRO `19993973`; a sincronização incremental adicionou 60 eventos de 57 contatos em MedSystems e 39 eventos de 37 contatos em BeautySystems.

## Definição do indicador

Um lead é um **contato único por conta do RD Station** que, no período, atende a pelo menos uma das condições abaixo:

1. possui evento de conversão com **UTM paga comprovada**; ou
2. converte em **página ou formulário comprovadamente usado por mídia**, isto é, o mesmo caminho normalizado de landing page ou identificador de conversão também aparece em evento com UTM paga na mesma conta e no mesmo período.

Eventos de importação/CSV são excluídos. Valores literais inválidos, como `null`, `undefined` e `not set`, não são aceitos como UTM. A identificação paga considera meio pago, fonte reconhecida de plataforma de anúncios acompanhada de campanha ou presença de `utm_id`. Quando um contato atende às duas condições, ele é contado apenas uma vez.

> **Limitação de atribuição:** o critério de página/formulário amplia a cobertura para além dos contatos com UTM. Uma página pode receber tráfego pago e não pago; portanto, essa parcela indica conversão em ativo comprovadamente utilizado por mídia, e não atribuição determinística do clique individual.

## Resultado auditado no RD Station

| Período | BU | Contatos com conversão | Com UTM paga | Em página/formulário de mídia | Sobreposição | Leads únicos pelo critério |
|---|---|---:|---:|---:|---:|---:|
| 01–30/07 | MedSystems | 956 | 484 | 576 | 484 | **576** |
| 01–30/07 | BeautySystems | 756 | 578 | 632 | 578 | **632** |
| 01–30/08 | MedSystems | 1.322 | 701 | 1.019 | 701 | **1.019** |
| 01–30/08 | BeautySystems | 2.881 | 732 | 854 | 732 | **854** |

| Indicador | MedSystems | BeautySystems | Consolidado |
|---|---:|---:|---:|
| Leads 01–30/07 | 576 | 632 | **1.208** |
| Leads 01–30/08 | 1.019 | 854 | **1.873** |
| Variação absoluta | +443 | +222 | **+665** |
| Crescimento | +76,9% | +35,1% | **+55,0%** |

## Investimento e CPL no mesmo corte

O investimento foi reconsultado no Windsor.ai em 31/08/2026 para o período de 01–30/08/2026. Foram usadas apenas as quatro contas oficiais, em BRL, no nível diário de campanha, com reconciliação pela chave `plataforma + conta + data + campaign_id`. A maior data retornada por Meta e Google foi 30/08/2026.

| BU | Google Ads | Meta Ads | Google + Meta | Leads RD | CPL calculado |
|---|---:|---:|---:|---:|---:|
| MedSystems | R$ 9.235,22 | R$ 39.136,99 | **R$ 48.372,21** | 1.019 | **R$ 47,47** |
| BeautySystems | R$ 8.454,26 | R$ 33.757,23 | **R$ 42.211,49** | 854 | **R$ 49,43** |
| Consolidado | R$ 17.689,48 | R$ 72.894,22 | **R$ 90.583,70** | 1.873 | **R$ 48,36** |

Fórmula: **CPL = investimento Google Ads + Meta Ads ÷ leads únicos RD pelo critério acima**. O investimento de Programática permanece separado por não haver alocação auditável por BU no mesmo indicador.

## Separação de fontes no report

No slide executivo, **leads** usam RD Station; **MQL, SQL e conversão comercial** permanecem no Bitrix24; **investimento Google/Meta** usa Windsor.ai; e **Programática/Push** permanece na página dedicada com dados Publya. Nenhuma métrica comercial do Bitrix24 foi recalculada a partir do volume ampliado do RD Station.
