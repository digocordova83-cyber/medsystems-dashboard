# Revalidação RD Station — 10/09/2026

## Resultado corrigido

A primeira apuração de 10/09 retornou **9 eventos / 9 contatos únicos** porque reprocessou somente os contatos que já estavam disponíveis na carga local com criação ou última conversão no período. Esse número era **parcial** e foi substituído pela leitura completa da fonte RD Station.

## Fonte e corte

A revalidação percorreu todas as páginas das segmentações ativas no fuso `America/Sao_Paulo`: `Segmentação - BBRO - Midia paga` da MedSystems e `Segmentação - BBRO` da BeautySystems. Foram lidos 3.215 contatos MedSystems em 26 páginas e 4.662 contatos BeautySystems em 38 páginas. Para cada contato com criação ou última conversão em 10/09, a consulta de eventos de conversão foi feita diretamente na API do RD Station.

## Total validado

| BU | Eventos de conversão no dia | Eventos qualificados | Contatos únicos qualificados | Eventos excluídos |
|---|---:|---:|---:|---:|
| MedSystems | 23 | 23 | 18 | 0 |
| BeautySystems | 32 | 28 | 26 | 4 |
| **Total** | **55** | **51** | **44** | **4** |

Os quatro eventos excluídos pertencem à BeautySystems e possuem origem não permitida pela regra vigente. Não houve exclusões por importação. A carga local foi atualizada com os 55 eventos retornados e reproduziu exatamente os mesmos totais qualificados da consulta direta.

## Distribuição de origem dos eventos brutos

| BU | Mídia paga | Origem desconhecida | Outros canais | Origem não permitida |
|---|---:|---:|---:|---:|
| MedSystems | 7 | 9 | 7 | 0 |
| BeautySystems | 21 | 4 | 3 | 4 |
