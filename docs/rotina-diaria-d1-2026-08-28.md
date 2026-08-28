# Rotina diária D-1 — MedSystems

## Agendamento validado

| Campo | Valor |
|---|---|
| Nome | Atualização diária do dashboard MedSystems |
| Horário | 08:00 BRT (`0 0 11 * * *` em UTC) |
| Fuso | `America/Sao_Paulo` |
| Status | Ativo |
| Corte | D-1 até 23h59 de Brasília |

## Contas de mídia autorizadas

| Plataforma | Marca | Conta | Moeda |
|---|---|---|---|
| Meta Ads | Medsystems | `446269251699575` | BRL |
| Meta Ads | BeautySystems | `1655942005167160` | BRL |
| Google Ads | Medsystems | `672-710-7654` | BRL |
| Google Ads | BeautySystems | `864-759-2401` | BRL |

## Contrato de persistência

A carga de mídia trabalha exclusivamente no nível campanha. A chave canônica é `plataforma + conta + data + campaign_id`; `adGroupId` e `adId` são gravados como strings vazias não nulas. A persistência usa `ON DUPLICATE KEY UPDATE`, e a leitura dos KPIs seleciona a versão mais recente por chave antes de somar investimento, impressões, cliques e leads.

## Validação de cobertura em 28/08/2026

| Fonte | Última data observada | Situação frente ao D-1 de 27/08 |
|---|---|---|
| RD Station | 27/08/2026 | Alcançou D-1 |
| Bitrix24 Leads | 27/08/2026 | Alcançou D-1 |
| Bitrix24 Contatos | 26/08/2026 | Não alcançou D-1 |
| Bitrix24 Negócios | 26/08/2026 | Não alcançou D-1 |
| Google Ads | 26/08/2026 | Não alcançou D-1 |
| Meta Ads | 26/08/2026 | Não alcançou D-1 |

Os valores canônicos acumulados de 01 a 26/08 foram: Google Ads Medsystems R$ 7.512,45, Google Ads BeautySystems R$ 7.058,05, Meta Ads Medsystems R$ 31.548,96 e Meta Ads BeautySystems R$ 27.945,24. As fontes que não alcançaram D-1 devem permanecer registradas como exceção no resumo diário, sem estimativa ou preenchimento artificial.
