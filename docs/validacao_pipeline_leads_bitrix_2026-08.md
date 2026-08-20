# Validação — volume de leads Bitrix24 por Pipeline de Vendas

**Recorte inicial:** 01 a 18/08/2026, conforme os dados Bitrix24 disponíveis antes da atualização abaixo.

| Marca selecionada | Campo Bitrix24 | Pipeline aplicado | Leads retornados | Leads sem pipeline reconhecido no recorte |
|---|---|---|---:|---:|
| Medsystems | `UF_CRM_1739195085` | `15391` — Medsystems | 318 | 107 |
| BeautySystems | `UF_CRM_1739195085` | `15395` — Negócios e Redes | 2.169 | 107 |

O campo foi identificado na exportação fornecida como **Pipeline de Vendas** e confirmado nos metadados da API Bitrix24. Valores diferentes de `15391` e `15395`, vazios ou não reconhecidos permanecem fora dos filtros de marca e são comunicados como **não identificados**.

O volume de contatos criados não é exibido sob filtro individual porque não existe vínculo de pipeline comprovado para os contatos no recorte. A regra não usa nome, telefone ou e-mail para inferir a marca.

## Conferência adicional no endereço publicado

Em 20/08/2026, o endpoint publicado retornou **2.169 leads** para `brand=beautysystems`, com o método **Pipeline Negócios e Redes**. A aba no aplicativo usa o identificador de navegação `#bitrix`; referências ao hash `#bitrix24` abrem o Overview por não corresponderem ao identificador interno da aba.

Na validação visual seguinte, o filtro **BeautySystems** exibiu os mesmos **2.169 leads recebidos**, com o rótulo **Pipeline Negócios e Redes**, além de 30 leads com UTM e 260 negócios. O volume não permanece zerado após a atualização publicada.

## Atualização por API até 19/08/2026

Em 20/08/2026, a sincronização REST do Bitrix24 foi refeita com recorte de `01/08/2026 00:00:00 -03:00` até `20/08/2026 00:00:00 -03:00` (fim exclusivo), incluindo todo o dia 19/08. O dashboard passa a usar esse corte para os leads e negócios de agosto.

| Pipeline de Vendas | Referência da planilha | API após sincronização | IDs da planilha presentes na API | Registros adicionais atuais da API |
|---|---:|---:|---:|---:|
| Medsystems (`15391`) | 353 | 359 | 353 | 6 |
| Negócios e Redes / BeautySystems (`15395`) | 2.239 | 2.249 | 2.239 | 10 |

Todos os **2.592 IDs** presentes na aba Base da planilha estão retornados pela API no respectivo pipeline. A diferença remanescente é uma **superset atual da API**, de 16 leads: seis no pipeline Medsystems e dez em Negócios e Redes. Esses registros adicionais possuem datas de criação entre 01/08 e 19/08, logo a divergência não é causada pelo limite de data adotado. Sem trilha temporal do momento exato da exportação ou indicação de exclusão, eles permanecem no dashboard como retorno real e atual da API; não são apagados ou escondidos para forçar aderência artificial à planilha.

> A planilha é uma referência de validação; a produção continua baseada na API do Bitrix24. Uma equivalência histórica exata exigiria um snapshot da API no mesmo horário de geração da exportação, ou uma evidência formal do critério adicional utilizado na exportação.
