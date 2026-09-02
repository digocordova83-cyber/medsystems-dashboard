# Padrão canônico de leads de mídia paga no Bitrix24

## Definição oficial

O KPI oficial do funil é o número de **contatos únicos conciliados no Bitrix24** no período selecionado. O universo nasce na fonte de mídia: no recorte validado de 01/09, o CSV de referência; nos períodos futuros, as conversões equivalentes do RD Station. Um contato entra no funil somente quando a identidade da fonte é localizada no Bitrix24. A evidência considera UTM paga, plataforma de anúncios com campanha, `utm_id` ou conversão em página/formulário também observado com UTM paga no mesmo período e conta.

| Camada | Unidade | Uso |
|---|---|---|
| Fonte de mídia | Evento de conversão | Medir respostas geradas pelos ativos de mídia. |
| Pessoa | Identidade normalizada | Auditar repetições da mesma pessoa. |
| Funil CRM | Contato único conciliado | KPI oficial para Lead, MQL, SQL, negócio e ganho. |
| Qualidade do CRM | IDs Bitrix24 por contato | Monitorar duplicidades sem inflar silenciosamente o funil. |

## De-para e filtros do Bitrix24

O match usa, em ordem de confiabilidade, UUID do contato RD, e-mail normalizado, nome completo + telefone normalizado e telefone normalizado. A BU é obtida pelo campo de pipeline `UF_CRM_1739195085`: `15391` para MedSystems e `15395` para BeautySystems/Negócios e Redes. Quando esse campo está ausente ou divergente, a BU da evidência RD pode prevalecer somente quando o match é inequívoco; a origem original é preservada para auditoria.

O funil mantém os campos do Bitrix24 para responsável, etapa/status, origem, campanha, conjunto, criativo, posição, produto de interesse e vínculos de negócio. Esses campos são dimensões de leitura do contato conciliado e não podem excluir uma identidade já comprovada na fonte. MQL, SQL, negócio e ganho continuam sendo derivados das etapas e vínculos reais do CRM.

O universo canônico é a lista de identidades da fonte no período. O Bitrix24 é consultado para localizar essas pessoas e descrever sua situação comercial. `UF_CRM_1744808620 = Tráfego Pago`, título, pipeline e `DATE_CREATE` são campos de auditoria e segmentação, nunca filtros excludentes isolados. A data de coorte vem da conversão da fonte em `America/Sao_Paulo`; a data de criação no CRM pode ser diferente sem eliminar o contato.

| Campo Bitrix24 | Uso canônico |
|---|---|
| `ID` | Vínculo comercial e medição de duplicidades; não é a unidade do topo do funil. |
| `DATE_CREATE` | Data operacional do CRM; não substitui a data da conversão da fonte. |
| `TITLE` | Auditoria da origem RD; não exclui sozinho. |
| `UF_CRM_1744808620` | Evidência explícita `Tráfego Pago`. |
| `UF_CRM_1739195085` | Pipeline/BU: `15391` MedSystems; `15395` BeautySystems. |
| `STATUS_ID` | MQL, SQL e descarte conforme as regras do funil. |
| `CONTACT_ID`, e-mail, telefone e UUID RD | De-para seguro de identidade. |
| UTMs e payload RD embutido | Origem, campanha, conjunto e criativo. |

## Duplicidades

Cada identidade da fonte é contada uma única vez. Quando uma pessoa está associada a múltiplos IDs Bitrix24, o contato permanece uma única vez no funil e os IDs excedentes aparecem separadamente na seção de qualidade, agregados por BU, campanha e método de match. Nenhum nome, e-mail, telefone ou hash é retornado ao navegador.

## Rotina D-1

A atualização principal das fontes ocorre às 08h BRT. Após a carga de RD Station e Bitrix24, o Heartbeat de conciliação executa às 08h30 BRT, recalcula o D-1, grava snapshots agregados e idempotentes por BU e registra a versão `bitrix_unique_contact_v2`. Quando existe referência auditada para o período, ela define o universo; nos demais dias, a rotina usa o mesmo padrão de evidência extraído dinamicamente do RD Station.

## Validação de 01/09/2026

Com a regra canônica, as **86 conversões** da fonte tornam-se **75 contatos únicos conciliados**: 35 MedSystems e 40 BeautySystems. Esses contatos estão associados a 52 IDs distintos de lead no Bitrix24. Sete pessoas possuem múltiplos IDs, que permanecem visíveis como indicador de qualidade, mas não inflam o topo do funil.

Os números 39 MedSystems e 45 BeautySystems correspondem a IDs/registros do CRM, enquanto 41 e 45 são conversões da fonte. A leitura oficial solicitada não usa nenhuma dessas unidades como topo do funil: aplica apenas a deduplicação de pessoas, resultando em 35 MedSystems e 40 BeautySystems. Filtros isolados como título, origem paga, pipeline ou data do Bitrix24 não podem alterar esse universo.
