# Incidente 503 na aba Negócios — 02/09/2026

## Sintoma

A aba Negócios exibiu a mensagem técnica `Unexpected token 'S', "Service Unavailable" is not valid JSON`. O texto era a resposta 503 do servidor, recebida durante uma tentativa de carregar a consulta gerencial.

## Evidência e causa raiz

Os logs de produção registraram esgotamento do heap do processo Node.js durante `JSON.parse`, seguido de reinicialização automática do servidor. A regressão foi introduzida quando a aba passou a executar simultaneamente duas consultas completas de `rdOpportunityDashboard`: a consulta principal e uma segunda consulta-base apenas para obter as contagens de pipeline. Cada resposta carregava todo o funil, distribuições e atribuição por campanha, duplicando desnecessariamente o payload e a pressão de memória.

## Correção

A segunda consulta completa foi removida. As contagens-base de pipeline agora reutilizam `filterOptions.pipelines`, que já é calculado antes dos filtros dentro da resposta principal. A conciliação de leads continua em uma consulta separada e leve. A mensagem de erro também foi normalizada: respostas 503 ou falhas de parsing agora aparecem como indisponibilidade temporária, sem expor texto técnico ao usuário.

Após a publicação da correção, o domínio oficial `medsystems.bbro.com.br` respondeu normalmente e apresentou a tela de login. A validação autenticada da aba Negócios foi iniciada com o perfil cliente existente.

O login em produção foi concluído com sucesso. A aba Negócios entrou no estado normal de carregamento do funil, sem retornar imediatamente o erro 503/parsing observado antes da correção.

Na primeira validação após o deploy, a página não exibiu novo erro no console, porém a consulta principal permaneceu em carregamento por mais de vinte segundos. A remoção da duplicidade evitou a falha imediata, mas o tempo de processamento em produção ainda requer redução adicional antes de considerar o incidente encerrado.

A análise de recursos do navegador mostrou que o componente `RevenueAnalytics` iniciava em Overview durante o primeiro render e só depois aplicava `#bitrix`. Esse intervalo disparava seis consultas legadas pesadas, mesmo quando o usuário abria diretamente Negócios. A aba passou a ser inicializada de forma síncrona pelo hash. Após essa segunda correção, Negócios carregou completamente no ambiente atualizado, com 50 registros no Bitrix24 e o bloco de conciliação 86/75/50.

Na medição final, após a autenticação, foram observadas somente `bitrix24.rdOpportunityDashboard` e `leads.reconciliation` no lote da aba Negócios. O lote concluiu em aproximadamente 1,0 segundo e transferiu cerca de 23 KB; as consultas legadas do Overview deixaram de ser disparadas.

A segunda correção foi publicada no domínio oficial. A sessão existente foi validada e a aba Negócios iniciou diretamente, sem exibir o erro 503/parsing. A conclusão do carregamento e as requisições efetivamente disparadas em produção ainda foram verificadas na sequência.

A primeira medição no domínio oficial, feita sobre a sessão já aberta antes da conclusão do deploy, ainda mostrou o lote legado com consultas do Overview. Como a navegação ocorreu na mesma URL de uma aplicação já carregada, foi necessário forçar uma recarga completa para garantir o uso do novo bundle antes da validação definitiva.

A recarga completa foi executada após a confirmação de que o deploy estava disponível no domínio oficial. As medições seguintes consideram somente essa nova sessão do bundle publicado.

O navegador foi reaberto diretamente em `#bitrix` após a recarga, preservando a sessão cliente e iniciando a consulta da aba Negócios no bundle atualizado.

## Validação definitiva em produção

Após recarga completa, a aba Negócios carregou no domínio oficial sem 503 e exibiu o funil, a conciliação 86/75/50, os cartões por BU e os filtros do CRM. O navegador registrou somente `auth.me` e o lote `bitrix24.rdOpportunityDashboard,leads.reconciliation`; o lote analítico concluiu em aproximadamente 5,6 segundos em produção. Nenhuma consulta legada do Overview foi disparada.

## Validação

Foram aprovados dez testes focados, a checagem TypeScript, o build de produção e a checagem de integridade do diff. A aba Negócios voltou a carregar no ambiente de prévia com 50 registros Bitrix24 e o bloco de conciliação 86/75/50, sem a consulta Bitrix duplicada.
