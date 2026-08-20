# Caminhos de coleta do RD Station

## Estado operacional de agosto de 2026

O dashboard usa o recorte de agosto obtido pelas segmentações BRRO fornecidas pelo usuário. A coleta foi feita por API, com persistência própria de contatos e eventos para as duas marcas.

| Caminho | Medsystems | BeautySystems | Status | Uso no dashboard |
|---|---:|---:|---|---|
| Segmentação BRRO | `19993961` | `19993973` | Sincronizada por API | Fonte do recorte de contatos e eventos de agosto até 17/08 |
| Contatos persistidos | `rdStationContacts` | `rdStationContacts` | Disponível | E-mail normalizado para de-para auditável |
| Eventos persistidos | `rdStationConversionEvents` | `rdStationConversionEvents` | Disponível | Data de conversão, UTM e evidência de origem |
| Rota direta ampla de contatos | Conta autorizada | Conta autorizada | Indisponível por erro transitório de listagem | Não usada no KPI atual |

## Critério atual de lead de mídia

O KPI de leads de mídia usa somente contatos distintos que possuem ao menos um evento RD Station no recorte com `utm_source` comprovada. A UTM pode existir na landing page ou no campo `traffic_source` codificado do evento. Eventos múltiplos do mesmo contato são deduplicados antes do de-para de identidade.

Após isso, a chegada ao Bitrix24 é aceita apenas quando o e-mail está presente de forma única no RD e no Bitrix24 e o lead comercial foi criado depois do primeiro evento RD com UTM.

## Limitações preservadas

A API de segmentação expõe o nome e o identificador BRRO, mas não a composição interna dos filtros de origem. Por isso, o dashboard não afirma que filtros internos de origem ou exclusão de Importação foram reproduzidos. O filtro comprovável e aplicado é a UTM presente no evento.

A rota direta de contatos em toda a base não é necessária ao recorte atual e não é usada como substituto da BRRO. Caso seja retomada no futuro, ela deverá manter paginação, cursor persistido, retry e isolamento por conta.
