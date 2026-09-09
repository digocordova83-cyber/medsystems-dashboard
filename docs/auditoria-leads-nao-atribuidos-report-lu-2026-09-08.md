# Auditoria de leads não atribuídos no Report Lu — 01–07/09/2026

## Critério confirmado

O usuário confirmou que o universo de lead de marketing deve usar o campo Bitrix24 **RD Station = sim**. O metadado oficial identifica esse campo como `UF_CRM_1738950899`; no payload, **`1` representa sim** e `0` representa não. O título do lead não é mais filtro de inclusão.

A BU continua definida exclusivamente pelo Pipeline de Vendas `UF_CRM_1739195085`:

| Pipeline | Classificação |
|---|---|
| `15391` | MedSystems |
| `15395` | BeautySystems / Negócios e Redes |
| `20889` | Consumíveis — BU não confirmada |
| ausente/outro | Não atribuído |

## Resultado da auditoria

O Report Lu anterior exigia `TITLE = Oportunidade do RD Station` e contabilizava 79 leads MedSystems e 159 BeautySystems. Esse filtro deixou de fora leads que possuíam `RD Station = sim` e pipeline de BU reconhecido.

| BU / situação | Universo anterior | Universo corrigido | Diferença |
|---|---:|---:|---:|
| MedSystems | 79 | 163 | +84 |
| BeautySystems | 159 | 243 | +84 |
| Não atribuído — pipeline 20889 | 20 monitorados | 23 | +3 |
| Não atribuído — sem pipeline | 0 | 2 | +2 |

O universo corrigido possui **406 leads atribuídos às BUs** e **25 leads não atribuídos**, totalizando 431 registros com `RD Station = sim` no período.

## Canais do universo corrigido

| Canal | MedSystems | BeautySystems | Total atribuído |
|---|---:|---:|---:|
| Mídia paga | 78 | 197 | 275 |
| Orgânico/direto | 21 | 35 | 56 |
| Referência | 2 | 5 | 7 |
| Não classificado | 62 | 6 | 68 |
| **Total** | **163** | **243** | **406** |

Os 23 registros do pipeline 20889 são classificados como mídia paga, mas permanecem fora das BUs porque o significado de DSB ainda não foi confirmado. Os dois registros sem pipeline permanecem não atribuídos e não são incorporados aos CPLs ou ao pacing das BUs.

## Implicações para o Report Lu

O relatório deve substituir o filtro de título pelo campo `RD Station = sim`, atualizar totais, canais, pacing, projeções e CPLs, e destacar separadamente os **25 leads não atribuídos**. Nenhuma redistribuição automática dos pipelines não reconhecidos é permitida.

## Fontes internas

1. Bitrix24, tabela `bitrix24Entities`, payloads de leads com `DATE_CREATE` convertido para `America/Sao_Paulo`.
2. Metadado Bitrix24 `crm.lead.fields`: `UF_CRM_1738950899` = `RD Station`.
3. Metodologia anterior: `docs/report-lu-bitrix-marketing-pacing-setembro-2026-09-08.md`.
