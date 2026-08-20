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
