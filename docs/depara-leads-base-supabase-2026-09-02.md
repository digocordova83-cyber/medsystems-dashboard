# De-para de leads — base de referência MedSystems e BeautySystems

## Escopo

Esta análise compara a base enviada em 02/09/2026, exportada de uma consulta Supabase, com os contatos e eventos de conversão do RD Station. A base possui os campos `client_slug`, `lead_name`, `lead_email`, `lead_phone`, `utm_source`, `utm_campaign`, `conversion_event` e `converted_at`. Nomes, e-mails, telefones, UUIDs e demais identificadores pessoais foram usados apenas no processamento local de correspondência e não constam nesta nota.

## Janela temporal

Os 86 registros da base aparecem em duas datas quando o timestamp é lido sem conversão: 70 em 01/09 e 16 em 02/09. Todos, porém, pertencem a **01/09/2026 em America/Sao_Paulo**. Portanto, a contagem operacional D-1 deve sempre interpretar `converted_at` como timestamp e depois converter para horário de Brasília; nunca deve agrupar pelo texto da data em UTC.

| Critério de data | Registros |
|---|---:|
| Texto bruto `2026-09-01` | 70 |
| Texto bruto `2026-09-02` | 16 |
| **01/09/2026 após conversão para Brasília** | **86** |

## Reconciliação do número informado pelo gestor

A base contém **41 registros** com `client_slug=medsystems` e **45 registros** com `client_slug=negocioserredes`, que corresponde a BeautySystems. Portanto, a base confirma o total informado de BeautySystems, mas mostra **41 — e não 39 — para MedSystems**. Há dois registros MedSystems com campanha iniciada em `bts`, porém o inverso também ocorre: 21 registros BeautySystems possuem campanha com prefixo `medical`. Isso demonstra que o prefixo de campanha, isoladamente, **não é uma regra confiável de BU** neste recorte.

| Fonte da contagem em 01/09 BRT | MedSystems | BeautySystems | Total |
|---|---:|---:|---:|
| Base de referência por `client_slug` | **41** | **45** | **86** |
| Número informado pelo gestor | 39 | 45 | 84 |
| Diferença ainda sem regra comprovada | **+2** | 0 | **+2** |

> A hipótese de excluir dois registros MedSystems reproduz o número 39, mas **não é adotada**: as colunas fornecidas não demonstram que esses dois registros sejam inválidos ou pertençam à outra BU. É necessário identificar o filtro, a lista de exclusão ou o identificador imutável usado pelo gestor.

## De-para de marcas e origem

| Campo de origem | Regra de tratamento | Resultado no dashboard |
|---|---|---|
| `client_slug=medsystems` | Origem declarada na base | Atribuir provisoriamente a MedSystems e preservar a evidência |
| `client_slug=negocioserredes` | Origem declarada na base | Atribuir provisoriamente a BeautySystems e preservar a evidência |
| Campanha com padrão `medical` / `medsystems` | Padrão de nomenclatura de campanha | Usar para investigação; não reatribuir BU automaticamente |
| Campanha com padrão `bts` / `beauty` / `negocios` | Padrão de nomenclatura de campanha | Usar para investigação; não reatribuir BU automaticamente |
| `client_slug` e padrão de campanha apontam para BUs diferentes | Inconsistência de classificação | Exibir como **Divergência de BU**; manter a BU declarada até haver mapeamento formal |
| `utm_source=facebook` ou `facebook ads` | Meta Ads | Normalizar como **Meta Ads** |
| `utm_source=google` | Google Ads | Normalizar como **Google Ads** |
| `utm_source=unknown` | Origem não comprovada | Preservar como **Não identificada**; não assumir mídia paga |

## Composição de origem na base de referência

| BU declarada na base | Meta / Facebook | Google | Origem `unknown` | Total bruto |
|---|---:|---:|---:|---:|
| MedSystems | 28 | 6 | 7 | 41 |
| BeautySystems | 37 | 2 | 6 | 45 |

Na base, há 34 registros MedSystems e 39 BeautySystems com origem de mídia identificada. Permanecem 7 registros MedSystems e 6 BeautySystems com `utm_source=unknown`. A origem `unknown` não deve ser convertida automaticamente em tráfego pago; deve permanecer visível como fila de investigação.

## Cruzamento com RD Station

O vínculo foi feito por **e-mail normalizado e único dentro da BU**, com telefone apenas como fallback. Foram correspondidos 41 de 41 registros MedSystems e 44 de 45 registros BeautySystems; um registro BeautySystems ainda não possui contato correspondente no recorte local.

| Verificação | MedSystems | BeautySystems |
|---|---:|---:|
| Registros da base | 41 | 45 |
| Correspondência única por e-mail no RD | 41 | 44 |
| Com evento D-1 já persistido localmente | 35 | 33 |
| Evento D-1 confirmado diretamente no RD, mas ausente localmente | 6 | 11 |

A consulta direta ao RD Station confirmou evento de conversão em 01/09 para os 17 contatos que estavam na base, tinham correspondência por e-mail, mas não estavam na tabela local de eventos. Portanto, o número anterior do dashboard não pode ser usado para concluir perda de leads: há uma **lacuna de sincronização de eventos**.

A causa verificável é a seleção atual do sincronizador: ela prioriza contatos cuja criação ou última conversão está dentro do dia. Quando a lista de contatos da segmentação não é revarrida desde a primeira página, o campo de última conversão local pode ficar defasado e impedir a seleção de um contato que possui um evento do D-1 na API. A coleta direta dos 17 casos confirmou o efeito.

## Padrão correto de indicadores

> **Não misturar volume de conversão, contatos únicos e atribuição paga.** Eles respondem perguntas diferentes e precisam coexistir no dashboard.

| Indicador | Definição | Chave de unicidade | Uso recomendado |
|---|---|---|---|
| Volume operacional de leads | Linha de conversão na fonte de referência, com BU declarada na origem | `lead_event_id`/`id` imutável da fonte | Comparação diária; nesta base: **41 MedSystems e 45 BeautySystems**, enquanto o filtro que produz 39 MedSystems ainda precisa ser documentado |
| Contatos únicos | Pessoa única com e-mail válido, por BU e período | `BU + e-mail normalizado` | Avaliar alcance real e evitar superestimar pessoas repetidas |
| Leads de mídia com origem comprovada | Registro com canal/campanha identificado e validado contra RD | Registro de origem + UTM/campanha/evento | Leitura por Google, Meta e campanha |
| Origem não identificada | Registro com `utm_source=unknown` ou ausência de evidência equivalente | Registro de origem | Fila de correção e análise; não atribuir a canal pago |
| Divergência de BU | `client_slug` e padrão de campanha apontam para BUs diferentes | Registro de origem | Fila de mapeamento; não reatribuir automaticamente |

## Ajuste operacional necessário

1. A fonte de referência deve disponibilizar uma chave imutável do evento — idealmente `id` ou `lead_event_id` da tabela Supabase — junto com os campos já presentes. Sem essa chave, a deduplicação de evento usa uma chave composta de BU, e-mail normalizado, timestamp, evento e campanha, que é menos robusta.
2. A sincronização diária do RD deve reiniciar a leitura da segmentação na página 1 antes de coletar eventos do D-1. Isso atualiza `last_conversion_date` de todos os contatos da segmentação e impede a lacuna observada de 6 eventos MedSystems e 11 BeautySystems.
3. O dashboard deve exibir, lado a lado, o volume operacional de conversões, os contatos únicos, os leads com origem paga comprovada, a origem não identificada e os conflitos de BU. O card principal de comparação com o gestor deve usar o primeiro indicador.
4. Após acesso de leitura à origem Supabase, a importação deve ser automatizada diariamente e reconciliada com RD Station. A regra que reduz MedSystems de 41 para 39 deve ser fornecida pelo responsável pela consulta antes de qualquer exclusão automática.

## Fontes internas

[1]: `pasted_file_ajolaj_SupabaseSnippetUntitledquery.csv` — base enviada pelo usuário em 02/09/2026.
[2]: `rdStationContacts` e `rdStationConversionEvents` — dados sincronizados do RD Station, consultados sem expor PII.
[3]: `https://developers.rdstation.com/reference/get_platform-analytics-conversions` — referência técnica do RD Station para estatísticas de ativos de conversão.
