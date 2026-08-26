# Alinhamento RD Station–Bitrix24 — 24/08/2026

## Fluxo e regra de negócio registrados

A reunião informa que conversões feitas no RD Station são, em princípio, enviadas ao Bitrix24, mas existem bloqueios para algumas landing pages. O objetivo acordado é comparar a base de leads do RD Station com a base do Bitrix24 usando nome, e-mail e telefone; quando houver correspondência no Bitrix24, exportar todos os campos do registro para investigar fonte, pipeline, etapas e demais alterações.

O filtro pelo título `Oportunidade do RD Station` foi usado na reunião como critério operacional, mas foi explicitamente questionado porque SDRs podem alterar o título do card. O pipeline também foi questionado como identificador de marca, pois leads podem ser direcionados a outros pipelines conforme profissão, produto, franquia, consumíveis ou demonstração.

Foi mencionado um campo/identificador `RD Station` no Bitrix24, possivelmente preenchido com código, e que esse campo deve ser investigado como sinal mais confiável de origem RD. Também foi discutido que registros de evento podem receber RD Station, embora não devam entrar automaticamente na visão de marketing. A separação sugerida é usar a fonte `Evento`, o identificador do evento e/ou tags/identificadores de importação.

A reunião propôs como boa prática incluir `evento` no identificador quando a conversão for de evento e configurar o Bitrix24 para classificar a fonte como evento. A fonte pode ser tráfego pago, orgânico, social, outros canais ou evento; o gestor de mídia informou que sua visão exclui importações e formulários e trabalha com tráfego pago, outros canais e desconhecido. UTMs são esperadas principalmente em tráfego pago; orgânico e evento podem não ter UTM.

## Procedimento de conciliação

O passo operacional acordado foi: exportar os leads RD do período fechado; cruzar com Bitrix24 por nome, e-mail e telefone; separar os que estão no Bitrix24 dos que não estão; e, para os encontrados, exportar todos os campos do Bitrix24 para avaliar se a fonte foi alterada, se o lead caiu em outra origem, se foi tratado como evento ou se não recebeu a marcação esperada.

A reunião menciona um corte de 01 a 23/08 como período fechado para o compromisso do dia 24/08. O pedido posterior do usuário solicitou 01 a 24/08; esse corte deve ser mantido quando explicitamente solicitado, mas precisa ser distinguido do corte fechado acordado na reunião.

## Implicações para o diagnóstico

Não usar `Oportunidade do RD Station` nem o pipeline isoladamente como prova definitiva de origem RD. Usar o cruzamento por identificadores pessoais normalizados e verificar o campo `RD Station`, fonte, identificador/evento, tags e UTMs do Bitrix24. Classificar cada caso como match por e-mail, match por telefone, match por nome, múltiplos matches, sem match ou match com evidência de evento/importação. Não inventar atribuições quando os campos forem ausentes, alterados ou conflitantes.
