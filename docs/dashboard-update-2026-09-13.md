# Atualização D-1 do Dashboard — 13/09/2026

## Escopo e regra vigente

O corte foi atualizado até **13/09/2026**, no fuso de São Paulo. A aba **Negócios** utiliza a metodologia vigente RD Station → Bitrix24: contatos qualificados no RD Station são localizados no CRM por e-mail exato ou, na ausência de e-mail correspondente, por nome normalizado. Em casos múltiplos, cada Lead técnico candidato entra no funil e continua sinalizado na auditoria. Registros sem BU reconhecida ficam explícitos e não entram no pacing de MedSystems + BeautySystems.

## Fontes atualizadas

| Fonte | Cobertura verificada | Resultado operacional |
|---|---|---|
| RD Station | Conversões até 13/09 | Sincronização completa das duas segmentações; em 13/09, 73 eventos qualificados e 71 contatos únicos: 40 MedSystems e 31 BeautySystems. |
| Bitrix24 | Leads, negócios e contatos de setembro | 717 Leads, 181 Negócios e 678 Contatos referenciados reimportados no mês; a lista da aba Negócios foi recalculada pelo cruzamento RD → Bitrix. |
| Google Ads | 01–13/09 | Retorno direto das contas oficiais 672-710-7654 e 864-759-2401, persistido por campanha e dia. |
| Meta Ads | 01–13/09 | Retorno direto das contas oficiais 446269251699575 e 1655942005167160, persistido por campanha e dia. |
| Publya / Push | Dados até 13/09 | Seis campanhas e três linhas de Push sincronizadas; os indicadores só somam uma ocorrência de snapshots duplicados entre relatórios. |

## Mídia paga: fechamento Google + Meta

| BU | Google Ads | Meta Ads | Google + Meta |
|---|---:|---:|---:|
| MedSystems | R$ 5.829,55 | R$ 19.941,64 | **R$ 25.771,19** |
| BeautySystems | R$ 5.829,78 | R$ 16.571,18 | **R$ 22.400,96** |
| **Consolidado** | **R$ 11.659,33** | **R$ 36.512,82** | **R$ 48.172,15** |

O importador Windsor passou a remover a chave provisória baseada em nome quando a fonte retorna o identificador técnico da mesma campanha, conta e data. A medida elimina dupla contagem de investimento causada por cargas anteriores que possuíam ambas as chaves.

## Validação visual

Na sessão autenticada, Google Ads e Meta Ads exibiram o intervalo **01/09/2026–13/09/2026**. Os totais visíveis foram R$ 11.659 e 78 leads de plataforma em Google, e R$ 36.513 e 385 leads de plataforma em Meta, compatíveis com os valores arredondados da base reconciliada. A aba Negócios abriu no mesmo intervalo com 874 Leads técnicos no funil RD → Bitrix, dos quais 399 são candidatos duplicados explicitamente sinalizados.

> A programática/Publya permanece reportada separadamente de Google + Meta. Não se deve somar seus valores aos R$ 48.172,15 sem verificar a janela e a ausência de snapshots duplicados de cada relatório.

## Etapa Consumíveis

Na consulta de metadados de etapas de Lead realizada em **14/09/2026**, o Bitrix24 não retornou uma etapa cadastrada com o rótulo **Consumíveis**. Assim, o Dashboard preserva a classificação oficial atual, **SDR**, sem renomear ou reclassificar registros. Quando a etapa for criada ou renomeada no CRM, o funil poderá exibi-la separadamente, mantendo MQL e SQL condicionados às etapas posteriores já definidas.
