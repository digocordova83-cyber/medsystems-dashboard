# QA — Google Ads, Meta Ads e Negócios

## Google Ads

Validação pública realizada em 21/08/2026 no recorte padrão **01/08 a 19/08/2026**. O painel carregou com 10 campanhas, investimento de R$ 16.465, 157 leads de plataforma, CPL de R$ 105, 7.279 cliques e cobertura até 19/08. O gráfico diário, a distribuição de verba, a tabela de campanha e os quatro insights gerenciais foram renderizados.

O painel usa exclusivamente linhas de campanha para KPIs e gráficos, evitando somar novamente as linhas de anúncio. A navegação pública exibe somente Overview, Google Ads, Meta Ads, Negócios e Guia de dados.

## Correção de transição

Durante a atualização por HMR, uma resposta antiga da consulta Bitrix24 permaneceu em cache e causou erro antes da troca de hash. Foi adicionada compatibilidade defensiva para coleções de filtros e ganhos ausentes; o servidor foi reiniciado e o painel Google carregou normalmente após a correção.

## Pendências de validação

- Confirmar filtro de campanha e métricas dos criativos Meta.
- Confirmar Negócios, filtros cruzados e fechamentos vinculados.
- Validar viewport mobile e suíte completa de testes.

## Meta Ads

Validação pública realizada no recorte padrão **01/08 a 19/08/2026**. O painel carregou 19 campanhas, investimento de R$ 65.947, 1.151 leads de plataforma, CPL de R$ 57 e 23.052 cliques. A distribuição de verba e o gráfico diário foram renderizados.

O snapshot Windsor.ai de status efetivo em **20/08/2026** identificou 128 anúncios ativos nas duas contas; 115 desses anúncios possuem linha de desempenho no intervalo até 19/08 e aparecem no painel. O anúncio `120250092627400326` exibiu o link oficial de prévia `https://fb.me/2tHPns9I6mkD9cQ`. Os demais anúncios sem link individual preservado são marcados como “Prévia indisponível”, sem criar imagem ou URL presumida.

Os insights destacaram medical-mpt-conversao-lp como maior verba, bts-aquapure-conversao-lp como maior volume de leads de plataforma, concentração de 38,7% nas três maiores campanhas e duas campanhas com investimento sem lead reportado. A interface explicita que são sinais de investigação e que as recomendações oficiais Meta não estão disponíveis no conector atual.

## Negócios

O recorte padrão de 01/08 a 19/08 carregou **535 leads** com título exato “Oportunidade do RD Station”, Evento excluído e 19 dias com entrada. Os filtros cruzados exibiram Pipeline de Vendas, responsável, Informações da fonte, etapa, posição e produto. A distribuição inicial trouxe 322 leads em Negócios e Redes, 196 em Medsystems e 17 em Consumíveis.

Foram encontrados 109 negócios ganhos com CLOSEDATE no período e valor total de R$ 21.222.133. A primeira versão evidenciou que nenhum desses negócios possui LEAD_ID vinculável ao recorte de leads. Para não ocultar uma informação comercial útil, a consulta foi ajustada para exibir **data de fechamento e origem diretamente do negócio**, mantendo a cobertura de vínculo por LEAD_ID em uma métrica separada e sem atribuição presumida.

## Ajuste dos criativos Meta

O status efetivo dos anúncios vem do snapshot de 20/08, enquanto as métricas disponíveis no banco são consolidadas com segurança no nível campanha. A galeria foi ajustada para não mostrar zeros de investimento, leads ou CPL como se fossem desempenho auditado do criativo; ela agora exibe status, campanha, ID, último registro e prévia oficial quando disponível.

Após o ajuste, a galeria Meta exibiu os anúncios ativos sem métricas artificiais no nível criativo, com quatro links oficiais de prévia visíveis na amostra inicial. A contagem exibida permaneceu em 115 anúncios ativos com registro histórico nas campanhas disponíveis no banco; o snapshot bruto contém 128 IDs ativos, e a diferença corresponde a IDs sem linha local de anúncio para compor nome e campanha.

O filtro da campanha **medical-mpt-conversao-lp** foi validado no navegador. Todo o painel foi recalculado para uma campanha: R$ 10.711 de investimento, 170 leads de plataforma, CPL de R$ 63, 3.598 cliques e 13 anúncios ativos identificados. O gráfico diário, a tabela, a distribuição de verba e a galeria passaram a refletir somente essa campanha; uma prévia oficial permaneceu disponível no recorte.

## Negócios — validação revisada

O painel passou a exibir os **109 negócios ganhos** por dia de fechamento e por origem declarada diretamente no negócio. O valor agregado do período permaneceu em R$ 21.222.133. Todos os 109 negócios apresentam a origem `APP VENDAS | APP VENDAS` no campo utilizado; nenhum possui LEAD_ID vinculável ao recorte de leads, portanto a cobertura de vínculo continua em 0% e não há atribuição presumida aos filtros de lead.

Os filtros dimensionais recalculam a análise de leads, enquanto o período recalcula entradas e fechamentos. A interface passou a explicar essa distinção explicitamente.

O filtro **Pipeline de Vendas = Negócios e Redes** foi validado no navegador: os leads caíram de 535 para 322, a média passou a 16,9 por dia ativo e os rankings de etapa, responsável, fonte, posição e produto foram recalculados. Os 109 fechamentos e sua origem direta permaneceram constantes porque nenhum negócio do período possui LEAD_ID utilizável para cruzamento com os filtros dimensionais — comportamento explicitamente informado na tela.

## Validação técnica final

Em 21/08/2026, a tipagem TypeScript foi aprovada, os **57 testes de 22 arquivos** passaram e o build de produção foi concluído. As capturas mobile confirmaram empilhamento adequado dos cabeçalhos, filtros e cards; os dados carregam após o estado transitório de consulta. O build apresentou apenas o aviso não bloqueante de tamanho do bundle Vite.
