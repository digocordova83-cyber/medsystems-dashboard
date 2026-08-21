# QA — aba Planilha Bitrix24

| Verificação | Resultado |
|---|---|
| Snapshot da guia Base | 2.592 registros preservados; período de 01/08 a 19/08/2026 |
| Pipeline BeautySystems | 2.239 registros sob o rótulo Negócios e Redes |
| Pipeline Medsystems | 353 registros |
| Integridade das distribuições | Pipelines, origens, etapas e série diária fecham com o total de 2.592 |
| Tipagem | `tsc --noEmit` aprovado |
| Testes focados | 15 testes aprovados |
| Compilação de produção | `pnpm build` aprovado |

## Revisão visual

A captura automatizada do preview sem sessão apresentou o estado protegido de acesso, como esperado para este dashboard. A aba foi estruturada com cabeçalho de fonte, quatro KPIs, gráfico diário por pipeline, rankings de origens, etapas, tecnologias, interesse, perfil, UF, cobertura e motivos de declínio. A revisão visual autenticada poderá ser feita no painel publicado pelo usuário.

## Validação pública posterior

Após a abertura do dashboard, a mesma aba foi carregada em navegador sem cookie de sessão. O painel exibiu os **2.592** leads, a série diária, a divisão BeautySystems/Medsystems e todas as análises agregadas sem apresentar o bloqueio de login. Nenhum valor de telefone, empresa ou outra informação pessoal foi exibido.

O Overview também foi verificado sem sessão: o carregamento concluiu e exibiu investimento, conversões, leads RD com UTM, chegadas confirmadas ao Bitrix24, negócios, vendas, receita e comparativo de canais. As rotas de sincronização e administração permanecem fora da navegação pública e continuam dependentes de permissão administrativa.

## Exclusão de Evento e filtro de marca

Foi aplicada a exclusão por campo estruturado. Na planilha, os **1.591** registros com `Fonte = Evento` foram retirados, deixando **1.001** leads no recorte. A validação pública do filtro **Medsystems** exibiu **353** leads, **143** de Tráfego pago e **61** descartes em etapa; a série diária e os rankings de origem e etapa foram atualizados junto com o filtro. BeautySystems permanece com **648** leads sem Evento, vinculados a Negócios e Redes.

Na aba operacional do Bitrix24, a exclusão foi aplicada ao campo estruturado `SOURCE_ID = UC_45K0VX` (Evento). A consulta pública exibiu **1.149** leads no recorte e o ranking de origem não contém a categoria Evento; os negócios permanecem inalterados, pois a solicitação foi restrita aos leads das visões Bitrix24 e Planilha.

O filtro **BeautySystems** também foi validado sem sessão: exibiu **648** leads sem Evento, **483** de Tráfego pago e **76** descartes em etapa. O pipeline mostrado é exclusivamente Negócios e Redes e a série diária passa a renderizar apenas a marca escolhida.
