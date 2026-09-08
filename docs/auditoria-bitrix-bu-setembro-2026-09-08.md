# Auditoria de Leads Bitrix24 por BU — setembro de 2026

## Escopo e unidade de análise

Auditoria executada em 08/09/2026, com recorte de **01/09 a 07/09/2026** em `America/Sao_Paulo`. A unidade oficial do funil é o **contato único com evidência paga no RD Station e correspondência inequívoca no Bitrix24**. O Bitrix24 é usado para etapa, pipeline, responsável, UTM e negócio; título, origem, pipeline e data de criação não são filtros excludentes isolados.

## Resultado reconciliado após a correção

| BU conciliada | Contatos únicos no Bitrix24 | IDs de lead Bitrix24 | IDs extras em duplicidades | MQL | SQL | Descartados |
|---|---:|---:|---:|---:|---:|---:|
| MedSystems | 109 | 128 | 19 | 61 | 11 | 16 |
| BeautySystems / Negócios e Redes | 212 | 247 | 35 | 130 | 27 | 6 |
| Total | 321 | 375 | 54 | 191 | 38 | 22 |

Os IDs extras são contexto de auditoria: não representam pessoas adicionais no funil. A classificação da BU conciliada continua a prevalecer quando o match de identidade for inequívoco.

## Verificação dos pipelines no CRM

| Pipeline Bitrix24 | Rótulo | Leads brutos criados em 01–07/09 | `Oportunidade do RD Station` | `Tráfego Pago` |
|---|---|---:|---:|---:|
| 15391 | Medsystems | 165 | 79 | 75 |
| 15395 | BeautySystems / Negócios e Redes | 249 | 159 | 189 |
| 20889 | Consumíveis — BU pendente | 24 | 20 | 3 |
| Sem pipeline | Não mapeado | 40 | 0 | 0 |

Os totais brutos de pipeline não devem substituir o funil oficial: incluem registros sem evidência paga da fonte, registros não conciliados e repetição de IDs. O pipeline **20889** segue sem atribuição de BU; não foi inferido nem agregado a MedSystems ou BeautySystems.

## Causa comprovada e correção aplicada

O carregamento do agregador priorizava exclusivamente as referências históricas quando existiam no período. Em setembro, essas referências estavam concentradas no recorte histórico, fazendo a evidência dinâmica do RD Station ficar invisível para a conciliação do mesmo período. Antes da correção, o agregador retornava 35 contatos MedSystems e 40 BeautySystems no recorte de 01–07/09.

A rotina agora **une** referências históricas e evidência dinâmica do RD por `BU + identityHash`, com a referência dinâmica prevalecendo apenas para a mesma identidade. Após a correção, o agregador retornou 109 contatos MedSystems e 212 BeautySystems localizados no Bitrix24. A regressão foi coberta por teste automatizado.

## Diferença entre RD e Bitrix24

A leitura dinâmica de evidência paga do RD no recorte encontrou 193 identidades MedSystems e 216 BeautySystems. O Bitrix24 localizou 109 e 212, respectivamente. Portanto, o ponto que requer acompanhamento é **MedSystems**: há identidades elegíveis na fonte ainda não localizadas pelo de-para do CRM. Essa diferença não foi compensada artificialmente por pipeline, título ou origem.

O indicador de 179 MedSystems e 212 BeautySystems informado a partir da aba RD deve ser mantido como leitura própria da fonte enquanto sua regra exata for diferente da evidência dinâmica acima. Ele não deve ser substituído nem usado para atribuir automaticamente IDs Bitrix24.

## Validação técnica

A correção foi testada com a auditoria pós-ajuste do mesmo recorte, que retornou 109 contatos MedSystems e 212 BeautySystems no Bitrix24. O snapshot diário de 07/09 foi reexecutado para confirmar que continua representando somente o D-1 — 10 contatos MedSystems e 30 BeautySystems — e não o acumulado mensal. Foram aprovados 12 testes focados do agregador e da conciliação, além de `pnpm check`, build de produção e validação de integridade do diff.

## Salvaguardas

- Nenhum nome, e-mail, telefone, hash ou payload bruto foi persistido neste relatório.
- O snapshot D-1 de 07/09 permanece uma leitura diária, não um acumulado mensal: 10 contatos MedSystems e 30 BeautySystems naquele dia.
- A rotina diária futura usará a união corrigida de referências para evitar nova subcontagem no período.
