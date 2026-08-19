# Notas de coleta RD Station — agosto de 2026

## Fontes consultadas

| Referência | URL | Constatação relevante |
|---|---|---|
| Documentação de Contatos | https://developers.rdstation.com/reference/contatos | A documentação pública descreve consulta de contato por UUID, e-mail ou telefone e a leitura de contatos associados a uma segmentação. |
| Índice de API RD Station | https://developers.rdstation.com/llms.txt | O índice documenta a rota de contatos de uma segmentação e não apresenta uma rota pública de criação de segmentações. |
| Perguntas frequentes de Segmentação | https://ajuda.rdstation.com/s/article/Frequently-Asked-Questions-Segmentation?language=en_US | Segmentações são listas dinâmicas; filtros por período de conversão têm limitações semânticas. |

## Caminho de coleta aprovado

As contas Medsystems e BeautySystems já possuíam segmentações chamadas **Todos os contatos da base de Leads**, respectivamente nos IDs `568976` e `12510116`. A coleta integral é executada exclusivamente por API pela rota de contatos de cada segmentação, com paginação e upsert idempotente.

## Limitação observada

A tentativa de leitura pela rota geral de contatos retornou `502 Internal Server Error`, inclusive com página mínima. Portanto, ela não é usada para o recorte. O filtro de agosto é aplicado localmente às datas retornadas pela coleta integral da segmentação.
