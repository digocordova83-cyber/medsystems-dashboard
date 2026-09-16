# Atualização D-1 do Dashboard — 15/09/2026

## Escopo e metodologia

O Dashboard foi atualizado até **15/09/2026**, considerando o fuso **America/Sao_Paulo**. A aba **Negócios** preserva a metodologia `rd_bitrix_multi_v1`: conversões qualificadas do RD Station são conciliadas com Leads do Bitrix24 por e-mail exato e, somente quando não houver e-mail correspondente, por nome normalizado. Em correspondências múltiplas, todos os Leads técnicos candidatos permanecem explícitos no funil e na auditoria.

## Sincronizações confirmadas

| Fonte | Cobertura | Resultado da atualização |
|---|---|---|
| RD Station | 01–15/09 | MedSystems: 3.390 contatos revisados, 72 contatos processados e 91 eventos armazenados. BeautySystems: 4.783 contatos revisados, 67 contatos processados e 86 eventos armazenados. |
| Bitrix24 | Setembro | 994 Leads, 223 Negócios e 797 Contatos referenciados sincronizados; negócios criados alcançam 15/09. |
| Google Ads | 01–15/09 | Duas contas oficiais reconciliadas por conta, data e ID técnico de campanha. |
| Meta Ads | 01–15/09 | Duas contas oficiais reconciliadas por conta, data e ID técnico de campanha. |
| Publya / Push | Até 15/09 | Sete campanhas e três linhas de Push sincronizadas. Custos seguem exibidos somente quando a fonte retorna valor verificável e sem sobreposição de snapshots. |

No dia **15/09**, o snapshot da aba Negócios registrou **77 contatos qualificados** no universo diário RD Station → Bitrix24: **24 MedSystems** e **53 BeautySystems**. O indicador preserva a regra vigente de correspondência e sinalização de candidatos múltiplos.

## Mídia paga: Google + Meta

| BU | Google Ads | Meta Ads | Google + Meta |
|---|---:|---:|---:|
| MedSystems | R$ 7.282,15 | R$ 22.879,83 | **R$ 30.161,98** |
| BeautySystems | R$ 7.193,41 | R$ 19.158,90 | **R$ 26.352,31** |
| **Consolidado** | **R$ 14.475,56** | **R$ 42.038,73** | **R$ 56.514,29** |

O importador de mídia remove a chave provisória baseada em nome quando a fonte retorna o ID técnico da mesma campanha, conta e data. Isso preserva a deduplicação de investimento mesmo quando uma campanha passa de identificação nominal para técnica.

## Validação

Foram executados **113 testes**, todos aprovados, além de verificação de tipagem e build de produção. A tela de acesso autenticado foi revisada visualmente após a atualização. A atualização não altera o cron diário nem reclassifica etapas do CRM: enquanto **Consumíveis** não existir como etapa no Bitrix24, a etapa oficial **SDR** permanece preservada.
