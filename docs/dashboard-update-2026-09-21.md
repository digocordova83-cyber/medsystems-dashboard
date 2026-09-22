# Atualização D-1 do Dashboard — 21/09/2026

## Escopo e fontes

A atualização considerou o corte de negócio de **21/09/2026**, em America/Sao_Paulo, com dados sincronizados em 22/09. Foram atualizados RD Station das duas contas, entidades de Leads, Negócios e Contatos referenciados no Bitrix24, Publya e Push, Google Ads e Meta Ads nas quatro contas oficiais do Windsor, além dos criativos Meta em nível de anúncio. O snapshot da aba Negócios foi persistido com a regra `rd_bitrix_multi_v1`. Os dados brutos permanecem preservados; a exclusão analítica de Aeskins e Advance continua aplicada no agregador.

## Resultado da sincronização

O RD Station processou 36 contatos e 47 eventos na conta MedSystems, e 40 contatos e 41 eventos na conta BeautySystems no ciclo. No acumulado de 01–21/09, os eventos qualificados pela regra de filtro totalizaram 760 na MedSystems e 692 na BeautySystems, equivalentes a 676 e 637 contatos únicos, respectivamente. Esses números são eventos/contatos do RD Station e não devem ser somados diretamente às linhas técnicas do funil Bitrix24.

O Bitrix24 foi reimportado para setembro com 1.437 Leads, 352 Negócios e 1.006 Contatos na base de entidades referenciada pelo ciclo. A aba Negócios, após a conciliação RD Station → Bitrix24 e as exclusões analíticas de Aeskins/Advance, ficou com 391 leads técnicos MedSystems e 1.210 BeautySystems; são 1.601 linhas técnicas nas BUs reconhecidas, 1.229 MQLs e 89 SQLs. O consolidado registra 64 negócios ganhos, com R$ 15.640.263,60 em valor ganho. As métricas de pessoas, IDs técnicos e linhas com correspondências múltiplas continuam separadas na interface.

O snapshot diário de 21/09 registrou 18 contatos qualificados MedSystems correspondentes a 23 IDs técnicos Bitrix, e 50 contatos BeautySystems correspondentes a 46 IDs técnicos. As duplicidades permanecem transparentes: 6 pessoas com múltiplos IDs em cada BU; os IDs extras são mantidos no funil conforme a regra vigente.

## Mídia paga

Google Ads e Meta Ads foram importados no nível campanha/dia com chave canônica plataforma + conta + data + campaign_id. A cobertura de 01–21/09 é Google de R$ 23.299,49 e Meta de R$ 61.316,11, totalizando **R$ 84.615,60**. Por BU, MedSystems soma R$ 44.487,72 e BeautySystems R$ 40.127,88. A leitura de leads de plataforma totaliza 134,0174 no Google e 619 no Meta; o CPL combinado de plataforma é aproximadamente R$ 112,37, sem misturar esse KPI com o funil RD Station → Bitrix24.

A carga ad-level Meta foi atualizada até 21/09: 986 linhas MedSystems e 1.031 BeautySystems, preservando as miniaturas existentes. O dashboard reconhece 127 criativos ativos com miniatura no corte, 56 MedSystems e 71 BeautySystems. Não há linhas provisórias por nome no nível campanha; a auditoria registrou 684 linhas canônicas de campanha e máxima de data 21/09.

## Programática e Push

A sincronização Publya concluiu com última data de dados em 21/09. O acumulado apresentado pela camada de programática é R$ 55.374,46, 1.034.536 impressões, 3.636 cliques, 434 conversões e 432 leads. O alcance é mantido como indicador não confiável na camada agregada, e a qualidade registra um snapshot duplicado controlado. O banco Push não retornou linhas no período, portanto sends, cliques e investimento de Push permanecem zero/nulos conforme a fonte; isso não é tratado como ausência de atividade fora do recorte retornado.

## Limitações e validação

Os valores de Google/Meta, programática, RD Station e Bitrix24 representam universos e definições diferentes. O dashboard mantém essas unidades separadas e exibe período, fonte e limitações. A rotina terminou sem erro operacional; os únicos avisos foram os avisos de configuração do pnpm sobre chaves legadas, sem impedir o processamento. A validação automatizada, TypeScript, build e revisão visual devem ser registradas no checkpoint após a conclusão.

## Validação final

A auditoria de integridade confirmou período final 21/09, snapshot com duas BUs, máxima de mídia em 21/09, zero linhas provisórias por nome, 684 chaves canônicas equivalentes a 684 linhas armazenadas e última data Publya em 21/09. Foram aprovados **115/115 testes Vitest**, `pnpm check` e `pnpm build`. O build gerou apenas o aviso conhecido de chunk JavaScript acima de 500 kB e os avisos do pnpm sobre chaves legadas de configuração; nenhum deles interrompeu o processo.

A revisão visual confirmou login administrativo, navegação e sessão autenticada no domínio publicado. Na captura final, o Overview permaneceu em carregamento assíncrono de métricas de mídia apesar de `auth.me` responder HTTP 200; por isso, os números desta atualização foram validados pelos agregadores, banco e auditoria estruturada, e a limitação visual foi registrada separadamente em `/tmp/medsystems-d1-2026-09-21/visual-validation.md`.

## Correção pós-validação do Overview

Em 22/09/2026, a revisão identificou que o cliente agrupava a consulta rápida de mídia com quatro consultas secundárias da camada CRM no mesmo lote HTTP. A consulta de mídia isolada respondia em 2.861 ms, mas o lote mantinha a tela em carregamento enquanto aguardava as consultas que não eram necessárias para a primeira renderização.

O frontend foi ajustado para carregar a mídia primeiro e iniciar a consulta comercial somente depois que a resposta de mídia estiver disponível. As consultas de funil detalhado continuam pertencendo à aba Negócios e não bloqueiam mais o Overview. A regressão foi coberta por teste automatizado. Após o ajuste, o preview autenticado exibiu os KPIs do corte de 01–21/09: investimento de R$ 84.616, 753 conversões de plataforma, 1.123 leads RD com UTM e 121 chegadas no Bitrix24. Esses valores são os agregados exibidos na interface para o período selecionado e não substituem as métricas de unidades distintas usadas nas auditorias RD→Bitrix.
