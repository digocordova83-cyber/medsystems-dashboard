# Incidente 503 na aba Negócios — 02/09/2026

## Sintoma

A aba Negócios exibiu a mensagem técnica `Unexpected token 'S', "Service Unavailable" is not valid JSON`. O texto era a resposta 503 do servidor, recebida durante uma tentativa de carregar a consulta gerencial.

## Evidência e causa raiz

Os logs de produção registraram esgotamento do heap do processo Node.js durante `JSON.parse`, seguido de reinicialização automática do servidor. A regressão foi introduzida quando a aba passou a executar simultaneamente duas consultas completas de `rdOpportunityDashboard`: a consulta principal e uma segunda consulta-base apenas para obter as contagens de pipeline. Cada resposta carregava todo o funil, distribuições e atribuição por campanha, duplicando desnecessariamente o payload e a pressão de memória.

## Correção

A segunda consulta completa foi removida. As contagens-base de pipeline agora reutilizam `filterOptions.pipelines`, que já é calculado antes dos filtros dentro da resposta principal. A conciliação de leads continua em uma consulta separada e leve. A mensagem de erro também foi normalizada: respostas 503 ou falhas de parsing agora aparecem como indisponibilidade temporária, sem expor texto técnico ao usuário.

## Validação

Foram aprovados dez testes focados, a checagem TypeScript, o build de produção e a checagem de integridade do diff. A aba Negócios voltou a carregar no ambiente de prévia com 50 registros Bitrix24 e o bloco de conciliação 86/75/50, sem a consulta Bitrix duplicada.
