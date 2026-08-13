# Dados de mídia confirmados — Windsor.ai

## Contas conectadas

| Plataforma | Marca | ID da conta | Nome retornado |
|---|---|---|---|
| Google Ads | Medsystems | `672-710-7654` | MedSystems |
| Google Ads | BeautySystems | `864-759-2401` | Medsystems Negócios & Redes |
| Meta Ads | Medsystems | `446269251699575` | Medsystems - Medical - Cartão |
| Meta Ads | BeautySystems | `1655942005167160` | Negócios e Redes - Cartão |

## Janela e campos confirmados

A consulta inicial foi realizada para **01/07/2026 a 31/07/2026**, com detalhamento diário por campanha.

| Plataforma | Campos confirmados |
|---|---|
| Google Ads | `date`, `account_id`, `account_name`, `campaign`, `campaign_id`, `campaign_name`, `spend`, `cost`, `impressions`, `clicks`, `conversions` |
| Meta Ads | `date`, `account_id`, `account_name`, `campaign`, `campaign_id`, `spend`, `reach`, `impressions`, `clicks`, `actions_lead` |

## Evidências de conexão

- Windsor.ai `get_connectors` retornou as contas de Google Ads e Meta Ads acima em 13/08/2026.
- Windsor.ai `get_data` retornou linhas de campanha diárias para as duas plataformas no período de julho de 2026.
- As respostas foram registradas localmente para implementação em:
  - `/home/ubuntu/.mcp/tool-results/2026-08-13_19-01-09.752126359_windsor-ai_get_data_eebed9be.json`
  - `/home/ubuntu/.mcp/tool-results/2026-08-13_19-02-24.067032858_windsor-ai_get_data_0d4e1eb4.json`

Os dados comerciais continuam sob as regras de atribuição auditável: nenhuma venda ou negócio será automaticamente associado a uma campanha sem identificador, UTM ou relacionamento comprovável.
