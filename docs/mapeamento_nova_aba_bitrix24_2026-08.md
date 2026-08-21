# Mapeamento da nova aba Bitrix24

## Critério principal

A nova aba usa exclusivamente leads com `TITLE = Oportunidade do RD Station`. No recorte persistido de agosto até 20/08/2026, a distribuição inicial por Pipeline de Vendas é:

| Código | Pipeline de Vendas | Leads |
|---|---|---:|
| 15395 | Negócios e Redes | 322 |
| 15391 | Medsystems | 196 |
| 20889 | Consumíveis | 17 |

## Campos confirmados pela API Bitrix24

| Informação solicitada | Campo Bitrix24 | Tipo |
|---|---|---|
| Nome do Lead | `TITLE` | string |
| Responsável | `ASSIGNED_BY_ID` | usuário |
| Informações da fonte | `SOURCE_DESCRIPTION` | string |
| Etapa | `STATUS_ID` | status CRM |
| Posição | `POST` | string |
| Produto de Interesse | `UF_CRM_1738950946` | string |
| Pipeline de Vendas | `UF_CRM_1739195085` | enumeração |

Os pipelines confirmados incluem Medsystems (`15391`), Negócios e Redes (`15395`) e Consumíveis (`20889`) dentro do recorte atual. Os rótulos de etapa e os nomes dos responsáveis serão resolvidos por API, sem expor e-mail, telefone ou outros dados pessoais.

## Responsáveis

O webhook atual não possui privilégio para consultar o diretório de usuários. Para preservar nomes gerenciais no recorte atual, foi criado um de-para por **ID técnico do lead** entre a exportação Bitrix24 enviada e o payload persistido da API. Foram aceitos somente vínculos unívocos:

| ID do responsável | Nome confirmado |
|---|---|
| 5521 | Vitor da Silva |
| 13877 | Marcela Assis Satilho Muller |
| 25441 | Maria Julia Pazinatto Rodrigues |
| 38111 | Eduardo Santos Franca |
| 56793 | Yasmin De Souza Freitas |

O ID `57359` apresentou dois nomes na exportação e permanece como **Responsável #57359 — nome não identificado**. Os IDs `7111` e `96` não possuem de-para no arquivo de referência e também permanecem identificados apenas pelo código, sem inferência.

## Etapas

Os rótulos de `STATUS_ID` foram consultados diretamente por `crm.status.list`, incluindo SDR, Primeiro Contato, Segundo Contato, Terceiro Contato, Relacionamento, Converter Lead, Histórico Lead Convertidos, Lead Descartado e Lead Descartado p/ MKT. A regra anterior de exclusão por `SOURCE_ID = UC_45K0VX` (Evento) será preservada na nova consulta.
