# QA — nova aba Bitrix24 gerencial

## Validação pública inicial

A aba reconstruída carregou sem sessão e aplicou o critério exato `Nome do Lead = Oportunidade do RD Station`, mantendo a origem estruturada Evento excluída. No recorte de 01 a 19/08/2026 foram exibidos **535 leads**, distribuídos em **322 Negócios e Redes**, **196 Medsystems** e **17 Consumíveis**.

| Verificação | Resultado |
|---|---|
| Filtro de Pipeline de Vendas | Seletor disponível com Todos, Negócios e Redes, Medsystems e Consumíveis |
| Leads por dia | 19 dias com entrada; pico de 40 leads em 19/08 |
| Responsáveis | 8 IDs; 502 dos 535 leads com nome confirmado por de-para unívoco |
| Etapas | Primeiro Contato lidera com 162 leads; descartes permanecem visíveis como etapas reais |
| Informações da fonte | Ranking carregado sem dados de contato pessoais |
| Posição e Produto de Interesse | Rankings carregados; marcadores literais `undefined`, `null` e `unknown` passam a ser normalizados como Não informado |
| Interface desktop | Hierarquia, KPIs, barras e filtro visíveis sem sobreposição no viewport de 1280 px |

Após a normalização, `Posição` passou a exibir **Não informado** para 31 valores anteriormente gravados como `undefined`, reduzindo corretamente a cobertura para **504 de 535 (94,2%)**. O total de leads e as demais distribuições permaneceram estáveis após a recompilação.

## Filtro Medsystems

O seletor foi aplicado ao pipeline `15391` e atualizou toda a aba para **196 leads**, **19 dias ativos**, média de **10,3 leads por dia ativo** e **6 responsáveis**. A série diária, responsáveis, etapas, cobertura, Informações da fonte, Posição, Produto de Interesse e insights foram recalculados no mesmo recorte. Marcela Assis Satilho Muller passou a liderar a carteira com 96 leads, e Primeiro Contato tornou-se a etapa dominante com 64.

## Filtro Negócios e Redes

O pipeline `15395` foi validado com **322 leads**, **19 dias ativos**, média de **16,9 leads por dia ativo** e **6 responsáveis**. Todos os blocos foram recalculados: Vitor da Silva liderou a carteira com 198 leads, Primeiro Contato concentrou 98 e o pico diário ocorreu em 13/08 com 25 leads. A cobertura de Posição ficou em 314 de 322, e 309 leads possuíam responsável com nome confirmado.

## Validação final

| Verificação | Resultado |
|---|---|
| Responsividade mobile | Layout empilhado e legível em 375 × 812; filtro, KPIs, gráfico, rankings, cobertura e insights permanecem acessíveis |
| Tipagem | `tsc --noEmit` aprovado |
| Testes | 21 arquivos e 52 testes aprovados |
| Build de produção | Compilação concluída sem erro |

O build preserva um aviso não bloqueante de tamanho do bundle já existente. Nenhum erro funcional, de tipagem ou de teste foi encontrado na reconstrução da aba.
