# Padrão canônico de leads de mídia paga no Bitrix24

## Definição oficial

O KPI oficial do funil é o número de **IDs únicos de lead do Bitrix24** no período selecionado. Um registro entra no universo quando existe evidência de mídia paga no RD Station ou quando o campo `UF_CRM_1744808620` do Bitrix24 está classificado como `Tráfego Pago`. A evidência do RD considera UTM paga, plataforma de anúncios com campanha, `utm_id` ou conversão em página/formulário também observado com UTM paga no mesmo período e conta.

| Camada | Unidade | Uso |
|---|---|---|
| Fonte de mídia | Evento de conversão | Medir respostas geradas pelos ativos de mídia. |
| Pessoa | Identidade normalizada | Auditar repetições da mesma pessoa. |
| Funil CRM | ID único do lead Bitrix24 | KPI oficial para Lead, MQL, SQL, negócio e ganho. |
| Qualidade do CRM | Pessoa com múltiplos IDs | Monitorar duplicidades sem reduzir silenciosamente o funil. |

## De-para e filtros do Bitrix24

O match usa, em ordem de confiabilidade, UUID do contato RD, e-mail normalizado, nome completo + telefone normalizado e telefone normalizado. A BU é obtida pelo campo de pipeline `UF_CRM_1739195085`: `15391` para MedSystems e `15395` para BeautySystems/Negócios e Redes. Quando esse campo está ausente ou divergente, a BU da evidência RD pode prevalecer somente quando o match é inequívoco; a origem original é preservada para auditoria.

O funil mantém os campos do Bitrix24 para data de criação do lead, responsável, etapa/status, origem, campanha, conjunto, criativo, posição e produto de interesse. MQL, SQL, negócio e ganho continuam sendo derivados das etapas e vínculos reais do CRM, nunca das contagens da fonte.

O universo canônico é a união de duas condições: `UF_CRM_1744808620 = Tráfego Pago` no lead Bitrix24 **ou** match seguro do lead com uma identidade que possua evidência paga no RD Station. O título `Oportunidade do RD Station` é campo de auditoria, mas não é usado isoladamente como exclusão, pois há leads pagos confirmados com outros títulos. Da mesma forma, o campo `Tráfego Pago` sozinho subconta registros cuja origem foi classificada de outra forma no CRM. A data é sempre interpretada em `America/Sao_Paulo`, com início inclusivo e dia seguinte exclusivo.

| Campo Bitrix24 | Uso canônico |
|---|---|
| `ID` | Unidade oficial do KPI e chave de deduplicação do funil. |
| `DATE_CREATE` | Coorte diária no fuso de Brasília. |
| `TITLE` | Auditoria da origem RD; não exclui sozinho. |
| `UF_CRM_1744808620` | Evidência explícita `Tráfego Pago`. |
| `UF_CRM_1739195085` | Pipeline/BU: `15391` MedSystems; `15395` BeautySystems. |
| `STATUS_ID` | MQL, SQL e descarte conforme as regras do funil. |
| `CONTACT_ID`, e-mail, telefone e UUID RD | De-para seguro de identidade. |
| UTMs e payload RD embutido | Origem, campanha, conjunto e criativo. |

## Duplicidades

Cada ID Bitrix24 é contado uma única vez. Quando uma identidade está associada a múltiplos IDs, todos os IDs permanecem no funil e o caso aparece separadamente na seção de qualidade, agregado por BU, campanha e método de match. Nenhum nome, e-mail, telefone ou hash é retornado ao navegador.

## Rotina D-1

A atualização principal das fontes ocorre às 08h BRT. Após a carga de RD Station e Bitrix24, o Heartbeat de conciliação executa às 08h30 BRT, recalcula o D-1, grava snapshots agregados e idempotentes por BU e registra a versão da regra `bitrix_lead_id_v1`. A rotina não depende do CSV histórico; o arquivo de 01/09 permanece apenas como evidência de validação daquele dia.

## Validação de 01/09/2026

Com a regra canônica, o snapshot persistido contém **55 IDs únicos de lead Bitrix24**: 12 MedSystems e 43 BeautySystems. O universo inclui cinco registros recuperados por match seguro fora da classificação paga original. Há cinco pessoas associadas a dez IDs, correspondendo a cinco IDs excedentes monitorados separadamente; nenhum deles é removido silenciosamente do funil.

Os números 39 MedSystems e 45 BeautySystems enviados pelo gestor pertencem a uma leitura de origem diferente e não são reproduzidos por um único filtro isolado do Bitrix24. Para 01/09, filtros testados como título `Oportunidade do RD Station`, campo `Tráfego Pago` ou pipeline, quando usados isoladamente, produzem universos diferentes. Por isso, a regra oficial permanece a união auditável de evidência paga e match seguro, contando cada ID Bitrix24 uma vez.
