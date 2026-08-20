# QA — atualização Bitrix24 até 19/08/2026

## Validações concluídas

| Verificação | Resultado |
|---|---|
| Sincronização REST de leads | Concluída: 2.740 retornos no recorte total do CRM |
| Sincronização REST de negócios | Concluída: 404 retornos no recorte total do CRM |
| Pipeline Medsystems (`15391`) | 359 leads retornados pela API |
| Pipeline Negócios e Redes / BeautySystems (`15395`) | 2.249 leads retornados pela API |
| Cobertura da planilha | Todos os 2.592 IDs exportados foram localizados na API |
| Tipagem TypeScript | Aprovada com `tsc --noEmit` |
| Testes unitários diretamente afetados | 20 testes aprovados |

## Observação de visualização

A abertura do ambiente de desenvolvimento iniciou o carregamento da interface. A segunda tentativa de inspeção visual não terminou devido a timeout da extensão do navegador (HTTP 504). Isso não altera os dados sincronizados nem a validação de tipagem e testes; a publicação será verificada no domínio público após o checkpoint.

## Testes externos não determinísticos

A execução completa da suíte apresentou três falhas por timeout de rede em chamadas externas já existentes: `crm.lead.list`, `profile` do Bitrix24 e uma consulta de segmentação RD Station. Os testes unitários e analíticos locais relacionados à alteração foram aprovados.
