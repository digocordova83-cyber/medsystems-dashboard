# QA da planilha histórica Bitrix24 — julho e agosto de 2026

## Escopo do arquivo entregue

Foi gerada a planilha `bitrix24_historico_julho_agosto_2026.xlsx` com seis abas: `Overview`, `Contatos_Unicos_Midia`, `Bitrix_Leads`, `Negocios_Vinculados`, `Campanhas_Origens` e `Dicionario_Metodologia`.

## Unidade analítica de cada aba

| Aba | Unidade | Critério principal |
|---|---|---|
| Overview | Resumo agregado | Consolida volumes e taxas por mês/BU |
| Contatos_Unicos_Midia | 1 linha por contato único da fonte | Coorte pela data de conversão RD persistida; match no Bitrix por UUID, e-mail, nome+telefone ou telefone exclusivo |
| Bitrix_Leads | 1 linha por ID de lead Bitrix24 | `DATE_CREATE` entre 01/07/2026 e 31/08/2026 |
| Negocios_Vinculados | 1 linha por ID de negócio Bitrix24 | Negócio criado no período, fechado no período ou vinculado a lead/contato do período |
| Campanhas_Origens | Agregação por mês, BU, origem e campanha | Prioriza campanha canônica do Bitrix; fallback documentado para RD e `SOURCE_DESCRIPTION` |
| Dicionario_Metodologia | Documentação | Campos, regras, limitações e cobertura |

## Cobertura observada na geração

| Métrica | Valor |
|---|---:|
| Leads Bitrix24 criados no período | 5.680 |
| Contatos únicos de mídia paga na fonte | 3.179 |
| Contatos de mídia localizados no Bitrix24 | 2.417 |
| Cobertura de localização | 76,0% |
| Negócios relevantes ao período | 1.322 |
| Eventos RD persistidos no período | 6.283 |

## Limitações registradas na própria planilha

1. A aba `Bitrix_Leads` usa apenas `DATE_CREATE` no recorte de 01/07/2026 a 31/08/2026.
2. A aba `Contatos_Unicos_Midia` usa a data de conversão da fonte RD e pode localizar no Bitrix24 leads criados fora do período.
3. Julho e agosto usam os eventos RD já persistidos no banco no momento da geração; esse recorte não recebeu a mesma validação linha a linha com CSV que foi feita para 01/09/2026.
4. O pipeline `20889` permanece sem BU confirmada e foi mantido como **Não identificada**, sem inferência.

## Validação automatizada

O arquivo `exports/bitrix_history_jul_aug_2026/workbook_qa.json` confirmou sem erros:

| Verificação | Resultado |
|---|---|
| Ordem esperada das abas | OK |
| Tabelas estruturadas nas abas principais | OK |
| Freeze panes nas abas principais | OK |
| Quantidade de linhas coerente com a base gerada | OK |
| Cabeçalhos proibidos com PII | OK |
| Issues automáticos | 0 |

## Validação visual

Foi gerada cópia PDF de QA por LibreOffice apenas para inspeção visual. Após o primeiro ciclo, o workbook foi ajustado para orientação paisagem e os gráficos do Overview passaram a combinar mês e BU nas categorias. A revisão manual da renderização final, com 11 páginas, confirmou que:

| Área revisada | Resultado |
|---|---|
| Overview com cards, tabelas e gráficos | Legível |
| Amostra de `Contatos_Unicos_Midia` | Legível |
| Amostra de `Bitrix_Leads` | Legível |
| Amostra de `Negocios_Vinculados` | Legível |
| Ranking de `Campanhas_Origens` | Legível |
| `Dicionario_Metodologia` | Legível |

O arquivo final mantém o Overview em uma página com melhor aproveitamento horizontal. As abas extensas são bases operacionais para filtro no Excel; a impressão mostra somente uma amostra controlada, evitando milhares de páginas.

## Privacidade

Não foram exportados nome, e-mail, telefone, endereços, comentários, hashes completos ou payloads brutos. A aba de contato único usa apenas uma chave anônima truncada para auditoria sem PII.
