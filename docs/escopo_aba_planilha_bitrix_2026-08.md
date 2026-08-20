# Escopo — aba Planilha Bitrix24

## Fonte e recorte

A aba utilizará exclusivamente a guia **Base** do arquivo `LeadsRecebidos19.08.xlsx`, fornecido pelo usuário. O arquivo contém **2.592 registros**, criados de **01/08/2026 a 19/08/2026**, e será identificado na interface como um **snapshot da planilha**, não como leitura em tempo real da API.

## Leituras que serão exibidas

| Leitura | Campo da planilha | Tratamento na aba |
|---|---|---|
| Volume de leads | `ID` | Contagem de registros da aba Base. |
| Série diária | `Criado` | Volume por dia, separado pelos dois valores de Pipeline de Vendas. |
| Marca/pipeline | `Pipeline de Vendas` | `Medsystems` e `Negócios e Redes`; este último é identificado como BeautySystems. |
| Canais e origens declaradas | `Fonte` | Ranking de categorias como Evento, Tráfego Pago, Orgânico e Social. |
| Andamento comercial | `Etapa` | Distribuição de estágios, incluindo descartes quando informados. |
| Interesse | `Tecnologia` e `Produto de Interesse` | Ranking separado, mantendo “não informado” explícito. |
| Perfil e qualidade | `Segmento`, `UF - PF` e campos de cobertura | Distribuições e completude agregadas, sem nomes, telefones ou empresas. |
| Motivos estruturados | `Motivo de declínio - WF0` | Ranking de valores preenchidos, separado do campo de observação livre. |

## Limites de evidência

> A planilha não contém um campo estruturado de plataforma de mídia, UTM ou identificador de campanha. Portanto, a aba não atribuirá seus registros a Google Ads, Meta Ads, campanhas ou ROAS. “Canais/origens” significa somente a categoria declarada no campo `Fonte` da planilha.

O campo `Total` está preenchido, porém sem valor monetário agregado no snapshot. Ele não será usado como receita, ticket ou valor de pipeline. Campos pessoais e textos livres de observação permanecem fora da interface.
