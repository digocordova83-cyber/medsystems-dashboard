# Atualização RD Station — recorte até 20/08/2026

## Método aplicado

As segmentações BRRO foram relidas integralmente por API para preservar a chegada de contatos mais recentes, com `upsert` por conta e UUID do contato. Em seguida, os eventos de conversão foram coletados para todos os contatos cuja criação ou última conversão caiu no recorte de 01/08 a 20/08, em lotes retomáveis e sem cruzar Medsystems com BeautySystems.

| Conta | Segmentação BRRO | Contatos retornados | Contatos com evento no recorte | Eventos no recorte | Último evento persistido |
|---|---:|---:|---:|---:|---|
| Medsystems | 19993961 | 1.716 | 929 | 1.044 | 20/08/2026 23:43:45 BRT |
| BeautySystems | 19993973 | 3.060 | 2.551 | 2.644 | 20/08/2026 23:58:34 BRT |

> Os totais de contatos da segmentação representam o retorno atual do RD Station para o BRRO. Os indicadores do dashboard de agosto usam o primeiro evento por contato dentro do período e mantêm UTMs, origem, campanha e marca somente quando presentes no retorno da API.

## Escopo de atualização

Os dados de mídia e CRM não foram alterados neste ciclo: mídia e Bitrix24 permanecem até 19/08. A atualização realizada foi exclusivamente do RD Station até 20/08.

## Métricas confirmadas no dashboard

Com o primeiro evento por contato no recorte de agosto, a aba RD Station passou a exibir **3.480 contatos com conversão** e **936 leads com UTM comprovada**. A composição dos leads com UTM é de **442 Medsystems** e **494 BeautySystems**. A série diária inclui 20/08 para as duas marcas, com 27 leads Medsystems e 22 BeautySystems naquele dia.
