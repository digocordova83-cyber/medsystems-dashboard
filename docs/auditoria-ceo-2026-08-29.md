# Auditoria de evidências para o PPT executivo

## Regra de corte

Para comparação mensal integrada, usar **01–26/07/2026 versus 01–26/08/2026**, último período comum disponível entre Bitrix24 e Windsor.ai. Programática e Push podem ser apresentados separadamente até **28/08/2026**, com o próprio corte explícito.

## Funil Bitrix24 — Tráfego Pago

Regra reproduzida do dashboard: `UF_CRM_1744808620 = Tráfego Pago`; MQL e SQL definidos pela etapa atual ou negócio vinculado; BUs identificadas somente pelos pipelines `15391` (MedSystems) e `15395` (BeautySystems).

| BU | Período | Leads | MQL | SQL | Negócios | Ganhos | Descartes | Lead→MQL | MQL→SQL |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Consolidado | 01–26/07 | 882 | 636 | 63 | 45 | 0 | 225 | 72,11% | 9,91% |
| Consolidado | 01–26/08 | 972 | 790 | 54 | 29 | 1 | 133 | 81,28% | 6,84% |
| MedSystems | 01–26/07 | 221 | 156 | 23 | 19 | 0 | 66 | 70,59% | 14,74% |
| MedSystems | 01–26/08 | 231 | 160 | 13 | 10 | 0 | 63 | 69,26% | 8,13% |
| BeautySystems | 01–26/07 | 637 | 479 | 39 | 25 | 0 | 159 | 75,20% | 8,14% |
| BeautySystems | 01–26/08 | 718 | 629 | 41 | 19 | 1 | 70 | 87,60% | 6,52% |

**Limitação:** o funil usa etapa atual e vínculos persistidos; sem histórico completo de transição, um descartado que passou por etapa anterior não é retroativamente classificado como MQL/SQL.

## RD Station — contatos convertidos e leads com UTM

| BU | Período | Contatos convertidos únicos | Contatos únicos com UTM |
|---|---|---:|---:|
| MedSystems | 01–26/07 | 849 | 426 |
| MedSystems | 01–26/08 | 1.126 | 611 |
| BeautySystems | 01–26/07 | 644 | 516 |
| BeautySystems | 01–26/08 | 2.749 | 656 |

## Windsor.ai — mídia canônica Meta/Google

Chave: plataforma + conta + data + campaign_id; somente nível campanha, `adGroupId` e `adId` vazios; versão mais recente por chave.

| BU | Plataforma | 01–26/07 Spend | 01–26/07 resultados de plataforma | 01–26/08 Spend | 01–26/08 resultados de plataforma |
|---|---|---:|---:|---:|---:|
| MedSystems | Google Ads | R$ 6.888,85 | 94 | R$ 7.512,45 | 106 |
| MedSystems | Meta Ads | R$ 16.672,89 | 368 | R$ 31.548,96 | 456 |
| BeautySystems | Google Ads | R$ 4.706,30 | 22 | R$ 7.058,05 | 29 |
| BeautySystems | Meta Ads | R$ 21.580,74 | 455 | R$ 27.945,24 | 461 |

Os resultados de plataforma não devem ser somados aos leads Bitrix/RD como se fossem a mesma métrica; servem apenas para eficiência da própria plataforma.

## Publya — cinco relatórios B2B até 28/08/2026

| Frente | Spend | Impressões/Disparos | Clicks/Link clicks reportados | Resultado |
|---|---:|---:|---:|---:|
| PMAX | R$ 5.695,59 | 106.281 impressões | 5.659 | 0 conversões reportadas |
| Meta | R$ 14.294,83 | 25.721 impressões | 858 | 45 leads |
| Display Geolocalização | R$ 9.883,19 | 623.669 impressões | 1.210 | objetivo Reach |
| Display Conversões | R$ 9.883,19 | 623.669 impressões | 1.210 | snapshot duplicado; não somado |
| Push | R$ 3.611,28 | 3.651 disparos | 15 | CTR 0,4108% |

Totais canônicos: **R$ 33.484,89 Spend**, **755.671 impressões**, **186.865 Reach**, **45 leads**, **3.651 disparos** e **15 interações Push**. A API marcou um snapshot DV360 duplicado; apenas uma ocorrência entra nos KPIs. `Reach` consolidado foi considerado instável pela própria validação do dashboard, apesar do valor pontual retornado.

Portais líderes por impressões: [uol.com.br](https://uol.com.br) 113.177; [noticias.uol.com.br](https://noticias.uol.com.br) 95.415; [globo.com](https://globo.com) 54.453. Formatos líderes: 300×250 (250.001), 970×250 (174.419), 728×90 (156.820).

Relatórios oficiais Publya:

- [PMAX](https://portal.publya.com/report/campaign/medsystems/v2/0325c3c0-b079-4ef3-96c2-3d32d98152d8)
- [Meta](https://portal.publya.com/report/campaign/medsystems/v2/3aa78e35-98c9-4815-a2d0-a852ce09944f)
- [Display Geolocalização](https://portal.publya.com/report/campaign/medsystems/v2/114f5f44-0df7-4752-8155-093f03cb96e9)
- [Display Conversões](https://portal.publya.com/report/campaign/medsystems/v2/4b357f73-70d6-4737-824b-80579caaff6b)
- [Push](https://push.publya.com/medsystems/b2b/xr50xt2cwdhc)

## Dados do deck anterior que não podem permanecer como fatos

Os números `SQL 27 → 98`, `MQL→SQL 3,1% → 9,5%`, `Med SQL 17 → 51`, `Beauty SQL 10 → 47`, `R$ 168.030 investidos`, `R$ 62 mil em programática` e `R$ 1.936 Keep It Real` foram fornecidos pela gerência, mas não foram reconciliados com as fontes integradas no mesmo recorte. Eles devem ser removidos da narrativa principal ou apresentados somente em uma seção explícita de **planejamento informado, ainda não reconciliado**.
