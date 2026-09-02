# Auditoria de existência do CSV no Bitrix24 — 01/09/2026

## Pergunta

Os leads da base de referência de 01/09/2026 existem no Bitrix24?

## Resposta auditável

A maior parte possui correspondência comprovada no Bitrix24, mas não é tecnicamente correto afirmar que 100% está confirmada com as chaves atuais. O cruzamento usa e-mail normalizado, UUID do contato RD e telefone quando ele identifica uma única pessoa na referência. Telefone compartilhado entre identidades diferentes foi mantido como ambíguo, sem atribuição automática.

| Recorte | Linhas do CSV | Pessoas únicas | Linhas com match comprovado | Pessoas com match comprovado | Linhas ambíguas | Pessoas ambíguas |
|---|---:|---:|---:|---:|---:|---:|
| MedSystems | 41 | 35 | 24 | 22 | 17 | 13 |
| BeautySystems | 45 | 40 | 44 | 39 | 1 | 1 |
| Consolidado | 86 | 75 | 68 | 61 | 18 | 14 |

Todos os 68 matches comprovados possuem ao menos um lead criado no Bitrix24 em 01/09/2026 no horário de Brasília. Não houve caso comprovado encontrado exclusivamente em outra data.

## Duplicidades do CRM

Entre as 68 linhas confirmadas, 19 encontram mais de um lead Bitrix24 para a mesma identidade. Por isso, quantidade de linhas do CSV, pessoas únicas e registros do CRM não são equivalentes e não devem ser somadas ou comparadas como se fossem a mesma métrica.

## Limitação

As 18 linhas restantes apresentam apenas coincidência por telefone compartilhado. Esse sinal é insuficiente para afirmar que o registro pertence à mesma pessoa sem nome, e-mail, UUID ou outra chave individual adicional. A base original anexada não está mais disponível no filesystem da sessão para testar nome combinado com telefone; os hashes persistidos preservam a privacidade, mas não permitem reconstruir o nome.

## Conclusão

Está comprovado que 68 das 86 linhas — equivalentes a 61 das 75 pessoas únicas — existem no Bitrix24. Os 18 casos restantes são ambíguos, não necessariamente ausentes. BeautySystems está quase integralmente confirmada; a incerteza está concentrada em MedSystems.
