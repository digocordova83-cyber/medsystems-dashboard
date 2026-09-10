# Cruzamento RD Station → Bitrix24 — 09/09/2026

## Escopo e método

Foram selecionados os contatos únicos associados a conversões do RD Station em 09/09/2026 no fuso `America/Sao_Paulo`, aplicando a regra de fontes permitidas e exclusão de eventos de importação. A busca no Bitrix24 foi feita diretamente pelo webhook autenticado, com chamadas individuais nas entidades `Lead` e `Contato` para cada e-mail e telefone normalizado disponível. Não há dados pessoais neste registro.

## Resultado

| BU | Contatos RD qualificados | Com e-mail | Com telefone | Encontrados como Lead | Encontrados como Contato | Encontrados no Bitrix24 |
|---|---:|---:|---:|---:|---:|---:|
| MedSystems | 28 | 28 | 12 | 8 | 6 | 9 |
| BeautySystems | 21 | 21 | 17 | 2 | 5 | 6 |
| **Total** | **49** | **49** | **29** | **10** | **11** | **15** |

O cruzamento completou 156 consultas de identidade sem falhas técnicas: quatro consultas para cada contato com pelo menos e-mail e/ou telefone, abrangendo `Lead/Contato × E-mail/Telefone`. Os totais por entidade podem se sobrepor: um mesmo contato RD pode existir simultaneamente como Lead e Contato no Bitrix24. Por isso, o indicador principal é **Encontrados no Bitrix24**: 15 de 49 contatos, ou 30,6%.

## Limitação explícita

Todos os 49 contatos tinham e-mail. Após a atualização de detalhes do RD Station, 29 tinham telefone disponível para busca. A ausência de telefone nos demais não impede o cruzamento por e-mail, mas limita a segunda chave de identidade para esses registros.
