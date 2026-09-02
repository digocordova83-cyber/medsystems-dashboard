# QA — ponte entre fonte de leads e Bitrix24

A aba **Negócios** foi validada com perfil de cliente no recorte de 01/09/2026. O topo comercial agora identifica explicitamente **50 Leads no Bitrix24**. Logo abaixo, a nova seção de conciliação exibe métricas independentes: 86 conversões na fonte de referência, 75 contatos únicos, 50 registros no CRM e diferença bruta de 36, com alerta de que essa diferença não equivale automaticamente a falha de integração.

| BU | Fonte | Pessoas | Gestor | Bitrix24 |
|---|---:|---:|---:|---:|
| MedSystems | 41 | 35 | 39 | 9 |
| BeautySystems | 45 | 40 | 45 | 41 |

O filtro foi renomeado para **Pipeline / marca no CRM**, e seu texto informa que 50/41/9 são contagens exclusivas do Bitrix24. Os números reconciliados permanecem separados para não misturar conversões, pessoas e registros comerciais.

O botão **Abrir análise completa** foi testado e direcionou corretamente para a aba Leads, preservando o recorte de 01/09 e exibindo 86 conversões, 75 contatos únicos, 41 MedSystems e 45 BeautySystems.

Foi estabelecido um viewport autenticado isolado de 390 × 844 para a validação mobile da aba Negócios; a inspeção visual do empilhamento será registrada após a captura.

No viewport mobile, o cabeçalho, o título Gestão de Negócios e o card Funil comercial de mídia paga empilharam corretamente, sem corte horizontal. O conteúdo interno foi posicionado na seção de conciliação para a inspeção dos KPIs e cards por BU.

Os campos de data, o botão Aplicar e os KPIs de Leads no Bitrix24, MQL e SQL também empilharam corretamente em 390 px. O viewport foi avançado até o bloco Fonte de referência × pessoas × CRM para a inspeção final.

O bloco de conciliação permaneceu legível em 390 px: título, explicação e botão de análise completa foram empilhados, seguidos pelos KPIs Conversões na fonte e Contatos únicos. Não foi observado corte horizontal; o viewport foi avançado para verificar os cartões restantes e a divisão por BU.

Os quatro KPIs ficaram legíveis e separados no mobile: 86 conversões, 75 pessoas, 50 registros no Bitrix24 e diferença bruta +36. O cartão MedSystems exibiu Fonte 41, Pessoas 35, Gestor 39 e Bitrix24 9 sem corte; a tela foi avançada para a verificação final de BeautySystems e do filtro comercial.

O cartão BeautySystems também ficou legível em 390 px, com Fonte 45, Pessoas 40, Gestor 45 e Bitrix24 41. Logo abaixo, o título **Pipeline / marca no CRM** preserva a separação entre os volumes reconciliados e as contagens 50/41/9 do Bitrix24. A revisão mobile foi concluída sem corte horizontal no bloco novo.
