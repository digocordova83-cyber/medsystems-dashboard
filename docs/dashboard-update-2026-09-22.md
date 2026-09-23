# Atualização D-1 do Dashboard — 22/09/2026

## Escopo e fontes

A atualização foi executada com corte de negócio em **22/09/2026**, no fuso America/Sao_Paulo, para refletir os dados fechados até ontem. Foram sincronizados RD Station nas duas contas, Leads, Negócios e Contatos referenciados do Bitrix24, Publya e Push, além de Google Ads e Meta Ads nas quatro contas oficiais do Windsor. O snapshot diário da aba Negócios foi persistido com a regra `rd_bitrix_multi_v1`.

## Nova leitura de Leads por pipeline

A aba Negócios passou a apresentar, além do funil reconciliado RD Station → Bitrix24, uma caixa independente denominada **Leads criados no Bitrix24 por pipeline**. Essa caixa reproduz a lógica de leitura usada na tabela encaminhada pela Isa: todos os Leads técnicos criados no período são contados diretamente pelo Pipeline de Vendas, sem exigir `RD Station = sim` e sem deduplicar pessoas.

| Universo | Total até 22/09 |
|---|---:|
| BeautySystems · pipeline 15395 | 837 |
| MedSystems · pipeline 15391 | 459 |
| Outras/sem BU | 229 |
| **Total geral no Bitrix24** | **1.525** |

A composição de **Outras/sem BU** é: 139 Leads sem pipeline, 88 no pipeline 20889 — “Não atribuído · pipeline 20889” — e 2 no pipeline Franquias. No período, não foram encontrados Leads nos pipelines analiticamente excluídos de Aeskins/Advance.

A imagem compartilhada pela Isa apresentava 836 BeautySystems, 458 Medical, 1.294 no subtotal das duas BUs e 1.521 no total geral. Comparando os mesmos tipos de universo, o dashboard até 22/09 apresenta **+1 Beauty, +1 Medical, +2 no subtotal reconhecido e +4 no total geral**. A diferença é compatível com o corte: a referência da Isa foi informada como “até hoje”, enquanto esta atualização D-1 considera dados fechados até 22/09. Não se trata de uma deduplicação ou de uma conversão silenciosa de Leads em pessoas.

A nova caixa fica separada do funil reconciliado. O funil continua utilizando contatos qualificados no RD Station localizados no Bitrix24 por e-mail exato ou nome normalizado; quando há múltiplos candidatos, cada Lead técnico permanece visível. Assim, os dois números não devem ser somados nem comparados como se tivessem a mesma definição.

## Resultado da sincronização

O RD Station processou 39 contatos e armazenou 45 eventos na conta MedSystems, e processou 60 contatos e armazenou 68 eventos na conta BeautySystems no ciclo D-1. O Bitrix24 foi reimportado para setembro com 1.525 Leads, 388 Negócios e 1.322 Contatos referenciados no retorno da rotina. O snapshot de 22/09 registrou 15 contatos qualificados MedSystems correspondentes a 14 IDs técnicos e 58 contatos BeautySystems correspondentes a 50 IDs técnicos. A regra manteve explícitos 5 contatos MedSystems e 8 BeautySystems com múltiplos Leads candidatos.

No funil reconciliado da aba Negócios, o corte apresenta 1.910 Leads técnicos, 1.495 MQLs e 213 SQLs. O resultado comercial separado registra 66 negócios ganhos, sendo 39 MedSystems e 27 BeautySystems, com valor total de R$ 16.144.263,60. Esses números são linhas técnicas e status atuais do CRM; não representam automaticamente 1.910 pessoas.

## Mídia paga

Google Ads e Meta Ads foram importados por campanha e dia com chave canônica plataforma + conta + data + campaign_id. O acumulado de 01–22/09 foi:

| Canal | Investimento | Leads/conversões de plataforma |
|---|---:|---:|
| Google Ads | R$ 24.864,22 | 139,0174 |
| Meta Ads | R$ 64.679,94 | 657 |
| **Google + Meta** | **R$ 89.544,16** | **796,0174** |

Por BU, o investimento foi de R$ 47.035,40 em MedSystems e R$ 42.508,75 em BeautySystems. A métrica de plataforma permanece separada dos Leads do CRM e do funil RD Station → Bitrix24.

## Programática e Push

No corte de 01–22/09, a camada programática apresentou R$ 58.598,31 de investimento, 1.161.462 impressões, 3.912 cliques, 464 conversões e 462 Leads. O alcance permanece marcado como indicador não confiável na camada agregada; a qualidade registra um snapshot duplicado controlado. A fonte Push não retornou linhas no período, portanto sends, cliques e investimento de Push permanecem zero/nulos conforme o retorno disponível.

## Validação

Foram aprovados **116 testes Vitest**, `pnpm check` e `pnpm build`. O build apresentou apenas o aviso conhecido de chunk JavaScript acima de 500 kB e o aviso do pnpm sobre chaves legadas de configuração. A revisão visual autenticada confirmou a aba Negócios no preview, a data final 22/09/2026 e a nova caixa com os totais 1.525, 837, 459 e 229 sem cortes ou sobreposição visual.

## Limitações e definição

O total bruto por pipeline é uma leitura operacional do Bitrix24. O funil RD Station → Bitrix24 é uma leitura reconciliada por identidade e pode conter múltiplas linhas técnicas para um mesmo contato. A BU reconhecida continua definida exclusivamente pelos pipelines 15391 e 15395; registros fora deles ficam na categoria Outras/sem BU na leitura bruta e não recebem BU inferida. Os dados pessoais permanecem restritos à auditoria autenticada e não fazem parte deste documento.
