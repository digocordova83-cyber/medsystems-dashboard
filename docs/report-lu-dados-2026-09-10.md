# Base auditada — Report Lu até 10/09/2026

## Regra do funil

O funil vigente considera contatos qualificados no RD Station localizados no Bitrix24 por e-mail exato ou, na ausência de e-mail correspondente, por nome normalizado. Nas correspondências múltiplas, cada Lead técnico Bitrix24 candidato entra no funil e permanece sinalizado na auditoria. MQL e SQL são a etapa atual do Lead no CRM, não uma passagem histórica comprovada.

## Funil de setembro — 01 a 10/09

| BU | Leads técnicos | MQL | Lead → MQL | SQL | MQL → SQL | Leads com evento de mídia paga |
|---|---:|---:|---:|---:|---:|---:|
| MedSystems | 124 | 90 | 72,6% | 13 | 14,4% | 82 |
| BeautySystems | 429 | 357 | 83,2% | 36 | 10,1% | 82 |
| **Total das BUs** | **553** | **447** | **80,8%** | **49** | **11,0%** | **164** |

Os 649 Leads técnicos exibidos no funil geral incluem BUs não reconhecidas, que não entram na meta consolidada de MedSystems + BeautySystems.

## Campanhas com SQL no período

| BU do pipeline | Campanha registrada | Leads | MQL | SQL | MQL → SQL |
|---|---|---:|---:|---:|---:|
| MedSystems | medical-mpt-lp | 15 | 9 | 2 | 22,2% |
| MedSystems | (direct) | 13 | 8 | 2 | 25,0% |
| MedSystems | medical-youlaser-prime-conversao-lp | 6 | 3 | 1 | 33,3% |
| BeautySystems | medical-dsb-conversao-lp | 26 | 24 | 18 | 75,0% |
| BeautySystems | medical-mpt-lp | 40 | 38 | 4 | 10,5% |
| BeautySystems | bts-search-mpt | 6 | 5 | 2 | 40,0% |
| BeautySystems | bts-aquapure-conversao-lp | 32 | 25 | 1 | 4,0% |
| BeautySystems | bts-vectra-conversao-lp | 28 | 21 | 1 | 4,8% |

Os nomes de campanha reproduzem os UTMs gravados nos registros. Por isso, nomes que parecem pertencer à outra BU permanecem como evidência de origem registrada e não são reclassificados inferencialmente.

## SQLs e negócios vinculados

O número histórico de **98 SQLs em agosto** foi informado pela gerência no relatório anterior, mas não possui lista individual ou definição reconciliada nas fontes integradas. Ele não pode ser rastreado individualmente até negócio sem inventar vínculos. Na regra atual, o cruzamento por `LEAD_ID` encontrou o seguinte:

| Coorte RD/Bitrix | SQLs únicos | Com negócio vinculado | Abertos | Ganhos | Perdidos |
|---|---:|---:|---:|---:|---:|
| Agosto | 182 | 60 | 58 | 1 | 1 |
| Setembro até 10/09 | 55 | 9 | 9 | 0 | 0 |

Em agosto, os SQLs únicos foram 81 MedSystems e 96 BeautySystems nos pipelines reconhecidos; há cinco registros adicionais sem BU reconhecida. Em setembro, os SQLs únicos reconhecidos foram 12 MedSystems e 22 BeautySystems; os demais estão fora das BUs de meta.

## Mídia e programática

O fechamento de 10/09 foi consultado diretamente nas quatro contas oficiais Windsor e persistido pelo importador D-1. Google + Meta acumulam **R$ 32.431,92 em MedSystems** e **R$ 27.170,73 em BeautySystems**, totalizando **R$ 59.602,65** até 10/09. As plataformas registram 335,0 leads em MedSystems e 313 em BeautySystems; os decimais de Google Ads devem ser preservados como métrica de conversão da plataforma, e não como pessoas únicas.

No Publya, as campanhas `B2B - Setembro` estão ativas desde 02/09 e os últimos snapshots retornam Meta com **8.222 impressões, 268 cliques e 30 leads/conversões**, e Google Ads com **12.767 impressões, 305 cliques e 1 conversão**, ambos no acumulado 01–10/09. O valor financeiro do snapshot Publya deve ser apresentado como métrica específica da plataforma, não somado ao investimento Windsor sem uma reconciliação de escopo.

Para programática DV360, a última entrega não nula é de agosto: o snapshot de `B2B - Geolocalização` traz 669.098 impressões, 1.110 cliques, CTR de 0,166% e viewability de 79,67%. O feed devolve os mesmos números para a campanha `B2B` e para `B2B - Geolocalização`; portanto, esses dois registros **não devem ser somados**. Ambas as campanhas DV360 constam como encerradas em agosto e os snapshots de setembro são zerados.

O slide de programática deve separar **entrega já observável** de **critério de sucesso ainda pendente**: entrega contratada, qualidade de visualização, tráfego qualificado com UTM e conversões/contatos rastreáveis até o CRM. A avaliação final de uma nova frente programática deve ocorrer no encerramento formal da campanha; para as frentes B2B de setembro, usar 30/09/2026, salvo mudança formal de período.
