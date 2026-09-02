# Auditoria CSV × RD Station — 01/09/2026

## Conclusão

Todos os **86 registros do CSV** foram localizados no RD Station e possuem a conversão correspondente em 01/09/2026, no horário de Brasília. As 86 linhas representam **75 contatos únicos**: 35 MedSystems e 40 BeautySystems. A diferença de 11 linhas corresponde a novas conversões da mesma pessoa, não a 11 pessoas adicionais.

| BU | Linhas/conversões no CSV | Contatos únicos | Contatos encontrados no RD | Conversões confirmadas no RD |
|---|---:|---:|---:|---:|
| MedSystems | 41 | 35 | 35 | 41 |
| BeautySystems | 45 | 40 | 40 | 45 |
| **Total** | **86** | **75** | **75** | **86** |

## Método

O cruzamento usou o `client_slug` para separar as contas: `medsystems` e `negocioserredes`/BeautySystems. A identidade foi normalizada por e-mail e, como contingência, nome + telefone e telefone único. Neste arquivo, 85 linhas encontraram o contato na base local por e-mail. Um contato BeautySystems que ainda não estava no cache local foi localizado diretamente na API do RD Station pelo mesmo e-mail.

A base local continha 68 das 86 conversões correspondentes. As 18 restantes foram consultadas diretamente na API do RD Station pelo UUID do contato; todas foram confirmadas no mesmo D-1 e com o mesmo identificador de conversão. Não houve erro de API nem caso não localizado após a verificação direta.

## Interpretação

Para medir resposta dos ativos de mídia, o total correto desta fonte é **86 conversões**. Para medir pessoas, o total correto é **75 contatos únicos**. Para o funil comercial, a unidade oficial continua sendo o **ID único do lead Bitrix24**, conforme o padrão canônico do dashboard. Essas três unidades não devem ser somadas nem apresentadas como equivalentes.

Nenhum nome, e-mail, telefone, UUID ou linha individual está incluído neste documento.
