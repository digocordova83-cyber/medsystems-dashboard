# Atualização diária — 27/08/2026

## Corte

A execução usou corte D-1 até 26/08/2026 às 23h59 no horário de Brasília.

| Fonte | Resultado | Cobertura efetiva |
|---|---|---|
| RD Station Medsystems | 1.916 contatos BRRO; 179 contatos novos/alterados reprocessados; 209 eventos encontrados no lote incremental | Eventos persistidos até 26/08/2026 23:46 BRT |
| RD Station BeautySystems | 3.248 contatos BRRO; 192 contatos novos/alterados reprocessados; 210 eventos encontrados no lote incremental | Eventos persistidos até 26/08/2026 23:46 BRT |
| Bitrix24 Leads | 3.208 registros de agosto sincronizados | Criação e atualização alcançam 26/08/2026 |
| Bitrix24 Negócios | 566 registros de agosto sincronizados | Atualizações alcançam 26/08/2026 |
| Bitrix24 Contatos | 579 contatos referenciados atualizados; 163 criados dentro da janela | Criações alcançam 26/08/2026 |
| Google Ads | Medsystems R$ 7.512,45; BeautySystems R$ 7.058,05 | 01 a 26/08/2026 |
| Meta Ads | Medsystems R$ 31.548,96; BeautySystems R$ 27.945,24 | 01 a 26/08/2026 |

## Validações

A mídia foi reconciliada pela versão mais recente de cada chave `plataforma + conta + data + campanha`, sem somar snapshots históricos. O RD Station passou a selecionar somente contatos ainda não sincronizados ou com nova conversão posterior à última sincronização, reduzindo a varredura diária sem perder eventos novos. TypeScript, 12 testes focados e o build de produção foram aprovados.
