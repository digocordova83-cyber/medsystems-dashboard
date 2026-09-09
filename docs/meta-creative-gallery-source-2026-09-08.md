# Fonte da galeria visual de criativos Meta

**Corte:** 01–08/09/2026.  
**Fonte:** Windsor.ai, conector `facebook`, consulta no nível de anúncio com `effective_status = ACTIVE`.  
**Resultado estruturado:** `/home/ubuntu/.mcp/tool-results/2026-09-09_17-23-31.973725628_windsor-ai_get_data_4c3f504e.json`.

## Contas oficiais utilizadas

| BU | ID da conta | Nome retornado pela fonte | Anúncios ativos | Campanhas ativas |
|---|---|---|---:|---:|
| MedSystems | `446269251699575` | Medsystems - Medical - Cartão | 66 | 11 |
| BeautySystems | `1655942005167160` | Negócios e Redes - Cartão | 65 | 11 |

Foram coletados **131 anúncios ativos**, todos com miniatura disponível. As miniaturas foram baixadas e reenviadas ao armazenamento estável do projeto; os caminhos `/manus-storage/...` foram persistidos no `rawPayload` das linhas de anúncio em `mediaDailyPerformance`.

Os campos confirmados no Windsor foram: campanha, conjunto, anúncio, status efetivo, link de prévia, miniatura, data, investimento, leads, impressões e cliques. A conta `1418731006678061`, identificada como MG Motor Brasil, foi descartada e não integra o dashboard.

## Regras de apresentação

As métricas do card de criativo são agregadas no nível de anúncio para o intervalo selecionado. O status “Ativo” corresponde ao snapshot de 08/09/2026. Quando a imagem não estiver acessível, a interface deve mostrar um estado neutro, sem inventar ou substituir o criativo.

## Validação visual na prévia

A aba Meta renderizou **131 criativos ativos**, com imagens reais carregadas pelo caminho `/manus-storage/...`, filtros de busca e conjunto e cards contendo verba, leads, CPL, CTR, impressões e cliques. Os primeiros cards exibiram miniaturas coerentes com os anúncios e links de prévia oficiais.

A área `Campanha → conjunto → criativo` da aba Negócios foi validada com cabeçalho hierárquico, nomes em até duas linhas, indicadores numéricos destacados e cartões responsivos em telas menores. O universo permaneceu em 442 IDs de lead no corte de 01–08/09/2026.

A busca `keep-it-real` foi validada na prévia e reduziu a galeria de 131 para **10 criativos**, preservando imagens, métricas e links. Conjuntos com nomes repetidos passaram a exibir também a campanha no seletor global, evitando ambiguidade entre anúncios de campanhas diferentes.

A auditoria final no banco confirmou **66 criativos MedSystems** e **65 BeautySystems**, todos com miniatura estável disponível. As métricas no nível de anúncio cobrem o período de 01 a 08/09/2026. Testes focados (13), TypeScript e build de produção foram aprovados; o console do navegador permaneceu sem erros durante busca, filtros e carregamento das imagens.
