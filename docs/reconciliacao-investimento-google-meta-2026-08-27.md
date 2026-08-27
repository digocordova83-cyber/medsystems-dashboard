# Reconciliação de investimento — Google Ads e Meta Ads

## Escopo

A auditoria foi executada em 27/08/2026 com corte de 01/08/2026 a 26/08/2026, no horário de Brasília. Foram usadas exclusivamente as contas MedSystems e BeautySystems conectadas no Windsor.ai, todas em BRL.

| Plataforma | Marca | Conta | Investimento canônico |
|---|---|---|---:|
| Google Ads | Medsystems | 672-710-7654 · MedSystems | R$ 7.512,45 |
| Google Ads | BeautySystems | 864-759-2401 · Medsystems Negócios & Redes | R$ 7.058,05 |
| Meta Ads | Medsystems | 446269251699575 · Medsystems - Medical - Cartão | R$ 31.548,96 |
| Meta Ads | BeautySystems | 1655942005167160 · Negócios e Redes - Cartão | R$ 27.945,24 |

## Causa raiz

A tabela preservava várias cargas completas do mesmo período. O índice único incluía `adGroupId` e `adId` nulos em registros de nível campanha; no MySQL, valores nulos não bloqueavam novas linhas equivalentes. As consultas somavam todas as cargas históricas, inflando Meta Ads para R$ 115.336,20 e Google Ads para R$ 28.370,95 no recorte antigo até 23/08.

## Correção

As consultas de Overview, Google Ads e Meta Ads agora escolhem somente a carga mais recente para a chave `plataforma + conta + data + campanha` antes de somar investimento, impressões, cliques e leads. Os dados brutos históricos continuam preservados. O importador canônico grava `adGroupId` e `adId` como strings vazias não nulas para que futuras cargas façam upsert. A rotina diária das 08h foi atualizada com as quatro contas permitidas, corte D-1, moeda BRL e validação de reconciliação por conta.

## Resultado validado

| Plataforma | Investimento de 01 a 26/08/2026 |
|---|---:|
| Google Ads | R$ 14.570,50 |
| Meta Ads | R$ 59.494,20 |
| Total no Overview | R$ 74.064,70 |

Os valores foram conferidos no retorno Windsor.ai, na base canônica e nas três telas do dashboard. A diferença de aproximadamente R$ 612 citada pelo gestor para Google Ads não pôde ser reproduzida sem o total exato da referência dele; o dashboard agora usa o Spend retornado pelas duas contas oficiais no Windsor.ai para o mesmo período e moeda.
