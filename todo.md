# Project TODO

- [x] Criar tabelas isoladas por conta para credenciais OAuth, estado de sincronização, contatos e eventos de conversão.
- [x] Configurar segredos por conta para client ID, client secret e URL pública de callback do RD Station Marketing.
- [x] Implementar endpoint público `GET /api/rdstation/callback` com validação de estado OAuth e associação segura à conta selecionada.
- [x] Implementar troca do código OAuth por tokens e armazenamento criptografado dos tokens no banco de dados.
- [x] Implementar renovação sob demanda do access token usando refresh token antes de chamadas à API do RD Station.
- [x] Implementar cliente da API RD Station Marketing para contatos, eventos de conversão, paginação e tratamento de limites de requisição.
- [x] Adicionar limite de tempo e retomada idempotente para páginas de contatos que respondam lentamente.
- [x] Persistir o cursor de página e o total de contatos por conta para retomar importações volumosas sem reiniciar a coleta.
- [x] Exibir no painel o progresso e a última página concluída para cada conta durante a importação de contatos.
- [x] Exibir e paginar as segmentações disponíveis por conta para selecionar o recorte de julho de 2026 no painel.
- [x] Implementar coleta manual de contatos e conversões do período de julho de 2026, com persistência e deduplicação por conta.
- [x] Implementar painel administrativo protegido, com autorização por conta, métricas de status, validade dos tokens e data da última sincronização.
- [x] Criar interface refinada, responsiva e acessível para administrar Medsystems e BeautySystems.
- [x] Criar testes unitários para OAuth, isolamento das contas, renovação de token e regras de período de coleta.
- [x] Validar a interface em desktop e mobile, revisar o registro de tarefas e criar checkpoint para publicação.
- [x] Configurar e validar uma autorização OAuth independente para a conta Medsystems, sem reutilizar tokens ou dados da BeautySystems.
- [x] Configurar e validar uma autorização OAuth independente para a conta BeautySystems, sem reutilizar tokens ou dados da Medsystems.
- [x] Exibir no painel a separação visual e operacional entre as sincronizações de Medsystems e BeautySystems.
- [x] Registrar e testar com segurança o Client ID e Client Secret OAuth recebidos para a Medsystems.
- [x] Validar as credenciais da Medsystems pela autorização OAuth real e pela troca bem-sucedida do código retornado no callback.
- [x] Registrar e validar pelo fluxo OAuth real o Client ID e Client Secret da BeautySystems, sem reutilizar credenciais da Medsystems.
- [x] Aplicar em cada conta o filtro de origem com Desconhecido, Mídia paga, Outros canais e Outras publicidades.
- [x] Decisão registrada: manter a coleta direta do RD Station aprovada pelo usuário e não criar segmentações adicionais para reproduzir o filtro nativo exato de Importação neste escopo.
- [x] Limpar os contatos previamente importados a partir da segmentação ampla antes de carregar o recorte válido de julho de 2026.
- [x] Calcular os leads de julho de 2026 por conta somente após aplicar as regras de origem permitida e recurso diferente de Importação.
- [x] Consolidar e entregar separadamente primeira conversão em julho/2026 e última conversão em julho/2026 para Medsystems e BeautySystems.
- [x] Coletar os eventos diretamente pela API para calcular as duas visões de julho sem depender de segmentações criadas no Dashboard.
- [x] Aplicar a alternativa de API direta autorizada pelo usuário, registrando a origem decodificada e a exclusão técnica de Importação por identificador ou família de evento.
- [x] Concluir nesta sessão os lotes de API direta para as quatro visões de julho de 2026 escolhidas pelo usuário.
- [x] Validar antes da entrega que todas as linhas consolidadas estejam entre 01/07/2026 e 31/07/2026.
- [x] Documentar no painel e no relatório que a exclusão de Importação pela API direta é heurística e não reproduz integralmente o filtro do Dashboard do RD Station.
- [x] Implementar e validar a conexão inicial segura do Bitrix24 Medsystems via webhook, separada do RD Station.
- [x] Registrar e validar o webhook REST do Bitrix24 da Medsystems com permissões de CRM, sem expor a URL secreta.
- [x] Implementar armazenamento próprio e sincronizações reais de dados do Bitrix24, com isolamento operacional além do status de conexão.
- [x] Importar leads, contatos e negócios do Bitrix24 Medsystems restritos a julho de 2026, com totais validados por entidade.
- [x] Usar exclusivamente DATE_CREATE entre 01/07/2026 e 31/07/2026 como critério de inclusão da coleta Bitrix24.
- [x] Exibir no painel os totais dos registros Bitrix24 importados para julho de 2026 por entidade.
- [x] Exibir no painel o status protegido da conexão Bitrix24 Medsystems e as permissões CRM validadas.
- [x] Calcular negócios fechados, valores, descartes, motivos de descarte e origens para julho de 2026, registrando que o motivo não é estruturado no payload recebido.
- [x] Exibir a visão analítica de negócios de julho no painel administrativo Bitrix24.
- [x] Criar navegação analítica com Overview, Google Ads, Meta Ads, Negócios, Origem & Funil e Perdidos & Descartes.
- [x] Implementar filtros globais de marca, período, canal e status sem alterar os dados de origem.
- [x] Modelar a camada analítica normalizada fim a fim para mídia, leads, negócios, vendas, receita, origens e UTMs, com vínculos persistidos somente quando houver contato RD, evento RD e identificador de campanha exatos.
- [x] Persistir as métricas reais de julho de 2026 de Google Ads e Meta Ads retornadas pelo Windsor.ai em uma camada normalizada por marca, plataforma e campanha.
- [x] Construir o overview executivo com investimento, leads, CPL, negócios, vendas e receita; exibir ROAS apenas após atribuição auditável por identificador ou UTM.
- [x] Construir funil de qualidade, visão de origens e visão de perdidos/descartes com dados Bitrix24 disponíveis.
- [x] Integrar dados de Google Ads e Meta Ads por conta, campanha, conjunto e anúncio após a autorização das plataformas.
- [x] Implementar atribuição auditável entre mídia, lead, negócio e venda por identificadores ou UTMs, sem inferir relações não comprovadas; negócios sem identificadores permanecem como “não identificado”.
- [x] Mapear, no portal Bitrix24 compartilhado, os campos existentes que registram perda, descarte e respectivos motivos antes de criar qualquer campo novo; o campo estruturado de descarte foi confirmado pelo usuário.
- [x] Identificar e validar o critério estruturado que separa Medsystems e BeautySystems no mesmo portal Bitrix24, mantendo as métricas comerciais isoladas por marca.
- [x] Aplicar a regra confirmada do campo `UF_CRM_1683207237`: “Medsystems” para Medsystems e “Negócios e Redes” para BeautySystems; manter outros valores fora das métricas por marca.
- [x] Decisão confirmada: exibir perdas exclusivamente pela etapa/pipeline do Bitrix24 e manter, separadamente, o motivo de descarte estruturado confirmado.
- [x] Validar e incorporar o campo existente `UF_CRM_1687285902` como motivo de descarte, usando suas opções reais sem reclassificação automática.
- [x] Tratar `UF_CRM_1769707203` exclusivamente como status financeiro, sem usá-lo como motivo de perda, descarte ou segmentação de marca.
- [x] Corrigir rótulos legados de Medsystems no overview para refletirem a marca ou a visão consolidada selecionada.
- [x] Exibir “Não identificado” ou “indisponível” para qualquer métrica, campo ou vínculo sem evidência armazenada, sem estimar ou criar valores substitutos.
- [x] Criar uma nova experiência de dashboard premium com navegação lateral, filtros globais e páginas de Overview, Google Ads, Meta Ads, Revenue, Origem & Funil e Perdidos & Descartes.
- [x] Adaptar as visualizações ao modelo de dados existente, mantendo ROAS e receita por canal bloqueados quando não houver atribuição auditável.
- [x] Decisão de publicação: manter o dashboard no endereço Manus Space atual `medoauth-pfvjidwp.manus.space`, sem configurar novo domínio ou prefixo neste momento.
- [x] Priorizar no recorte atualizado o de-para RD Station–Bitrix24 por e-mail exato e único para recuperar a origem mais próxima; telefone e CPF permanecem fora por ausência de chave utilizável.
- [x] Auditar a cobertura e unicidade de nome, e-mail e telefone entre leads Bitrix24 e contatos RD Station sem exibir valores pessoais; em julho, 40 matches de e-mail são únicos e 26 são ambíguos.
- [x] Enriquecer leads Bitrix24 por vínculo único com contatos e eventos RD Station, recuperando fonte, origem, UTMs e método de evidência.
- [x] Exibir no deck Revenue a cobertura e a qualidade do enriquecimento Bitrix24–RD Station, sem revelar dados pessoais e sem usar nome como chave isolada.
- [x] Criar uma aba-guia para cliente que explique as fontes, períodos, métricas e regras de cada cruzamento aplicado no dashboard.
- [x] Documentar na aba-guia as limitações, indisponibilidades e dúvidas de dados que ainda exigem validação do cliente ou das fontes.
- [x] Validar a navegação, a clareza e a responsividade da aba-guia antes de publicá-la.
- [x] Auditar a disponibilidade e unicidade de e-mail, telefone e CPF nos registros Bitrix24 e RD Station, sem exibir valores pessoais.
- [x] Criar de-para por e-mail normalizado e único, registrando o método de vínculo; telefone e CPF foram auditados como indisponíveis nas duas fontes neste recorte e não são usados para atribuição.
- [x] Aplicar os vínculos de identidade ao recorte de marca e à cobertura de UTM, exibindo apenas métricas agregadas e métodos de match no dashboard.
- [x] Auditar a cobertura das UTMs configuradas nas campanhas entre os leads Bitrix24 e eventos/contatos RD Station por período; no Bitrix24, a auditoria é somente consolidada porque os leads não possuem marca estruturada, enquanto o RD Station permanece separado por marca.
- [x] Modelar e exibir a comparação auditável de recebimento de UTM entre Bitrix24 e RD Station, mantendo como indisponível qualquer período sem coleta real de uma fonte.
- [x] Validar a cobertura de UTM dos leads Bitrix24 e contatos/eventos RD Station no mesmo recorte de julho, documentando campos ausentes: eventos contêm UTMs, contatos não.
- [x] Exibir a métrica Bitrix24 como indisponível sob filtro de marca enquanto os leads não tiverem marca estruturada comprovada.
- [x] Entregar ao usuário o inventário consolidado de URLs e UTMs por marca, plataforma e campanha, com exemplos reais observados no Windsor.ai.
- [x] Confirmar a entrega do inventário no registro de tarefas após o envio explícito ao usuário.
- [x] Auditar diretamente no Windsor.ai os campos e valores de URL, tracking template e UTMs de Google Ads e Meta Ads para agosto de 2026.
- [x] Comparar os padrões encontrados no Windsor.ai com UTMs recebidas no Bitrix24 e ajustar a conciliação somente diante de evidência verificável.
- [x] Auditar padrões de UTM term/content/campaign dos leads Bitrix24 contra identificadores, nomes e hierarquias de mídia importados.
- [x] Definir uma tabela de reconciliação auditável que aceite somente correspondências únicas e comprováveis, mantendo ambiguidades sem atribuição.
- [x] Aplicar a reconciliação confirmada ao ranking de campanhas, negócios e descartes e expor a evidência de correspondência no deck Revenue.
- [x] Auditar UTMs e identificadores de campanha existentes em leads e negócios do Bitrix24, por período e marca.
- [x] Modelar campanhas que geraram negócios, ganhos, perdidos e descartes somente por vínculo explícito de lead e campanha.
- [x] Exibir no deck Revenue o ranking de campanhas com negócios e descartes, incluindo motivos reais de descarte e estado “Não identificado” quando necessário.
- [x] Auditar, por período e marca, os campos Bitrix24 de origem, UTM e identificadores capazes de provar o canal de cada lead e negócio.
- [x] Modelar o funil auditável por canal: leads recebidos no Bitrix24, negócios, ganhos, perdidos e descartes; manter “Não identificado” sem evidência.
- [x] Inserir a análise de conversão por canal no deck contínuo de Revenue, com filtros globais de período, marca, canal e status.
- [x] Incluir explicitamente no funil a linha de negócios “Não identificado” sem `LEAD_ID` vinculável, com conversão indisponível e seus estágios reais.
- [x] Corrigir o total exibido de negócios vinculados para excluir a linha de negócios não identificados sem `LEAD_ID` comprovado.
- [x] Auditar e importar dados reais de agosto de 2026 para mídia e negócios, até 13/08; leads qualificados do RD Station permanecem explicitamente indisponíveis até sua coleta real.
- [x] Criar análises auditáveis de mídia com maior descarte, origem e motivo, sem vincular canal a descarte quando não houver identificador comprovado.
- [x] Transformar Revenue em um deck contínuo de análise, substituindo as subseções clicáveis por blocos sequenciais de pipeline, vendas, origens, perdas, descartes e status financeiro.
- [x] Remover o selo estático de julho do cabeçalho para que a interface reflita exclusivamente o período selecionado no dashboard.
- [x] Corrigir o erro de permissão ao carregar as consultas analíticas do dashboard publicado.
- [x] Unificar Revenue, Origem & Funil e Perdidos & Descartes em uma única visão de negócio, mantendo as subseções internas para pipeline, origens, vendas, perdas e descartes.
- [x] Restaurar no interior de Revenue as subseções explícitas Pipeline, Origem, Vendas, Perdidos e Descartes, sempre sincronizadas aos filtros globais.
- [x] Corrigir os rótulos do funil consolidado para refletir a marca selecionada, sem identificar incorretamente o modo “Todas as marcas” como Medsystems.
- [x] Atualizar Bitrix24 e mídia (Google Ads e Meta Ads) com dados reais de 01 a 17/08/2026, preservando as contas e marcas separadas.
- [x] Corrigir duplicidade de linhas consolidadas por campanha em agosto antes de exibir ou entregar os totais de mídia atualizados.
- [x] Decisão de escopo: a coleta direta ampla de 14 a 17/08 foi substituída pela segmentação BRRO válida sincronizada por API nas duas contas.
- [x] Decisão de escopo: não criar segmentações adicionais; os IDs BRRO fornecidos pelo usuário passaram a ser o recorte operacional de agosto.
- [x] Criar e sincronizar o recorte RD Station de 01 a 17/08/2026 exclusivamente por API, sem uso da interface web.
- [x] Decisão de escopo: não executar a importação integral de todas as contas; o dashboard usa o recorte BRRO sincronizado e auditado.
- [x] Decisão de escopo: não importar a base integral fora do recorte BRRO, para não misturar critérios de origem e período no dashboard.
- [x] Decisão de escopo: não recuperar páginas históricas fora da segmentação BRRO, pois elas não são necessárias ao recorte atual de agosto.
- [x] Decisão de escopo: não retomar a coleta integral após timeout; a sincronização BRRO com retomada controlada foi concluída.
- [x] Auditar e documentar os caminhos de coleta RD Station já usados, distinguindo segmentações existentes, contatos persistidos e a rota direta atualmente indisponível.
- [x] Localizar e sincronizar por API a nova segmentação RD Station criada pelo usuário para leads a partir do mês anterior.
- [x] Confirmar os IDs BRRO nas contas Medsystems e BeautySystems e sincronizar os dois recortes separadamente por API.
- [x] Sincronizar BRRO Medsystems (`19993961`) e BRRO BeautySystems (`19993973`) por API, aplicando o recorte de agosto até 17/08.
- [x] Sincronizar em lotes os eventos de conversão de agosto dos contatos BRRO para recuperar fonte, origem e UTMs por API.
- [x] Otimizar a coleta de eventos BRRO com concorrência controlada e retomada por cursor, sem alterar os critérios de evento ou duplicar registros.
- [x] Corrigir textos legados que informam indisponibilidade do RD Station em agosto após a sincronização BRRO concluída.
- [x] Atualizar a nota final da guia de dados para registrar a coleta BRRO de agosto concluída até 17/08.
- [x] Revisar rótulos internos e o registro auditado de agosto que ainda mencionam o corte de 13/08 ou RD parcialmente indisponível.
- [x] Sincronizar contatos e eventos das segmentações de agosto, reconciliar por e-mail único os leads RD com UTM com o Bitrix24 e atualizar os totais do dashboard.
- [x] Consultar, sincronizar e validar as fontes do dashboard exclusivamente por API, sem depender de operações manuais nas interfaces das plataformas.
- [x] Apurar e listar por API os leads de agosto do RD Station por marca e os leads do Bitrix24 até o último corte disponível, identificando explicitamente a data de cada fonte.
- [x] Auditar se o recorte RD Station de agosto aplicado por API corresponde aos filtros de leads gerados acordados e explicitar qualquer diferença de critério.
- [x] Decisão de evidência: manter o KPI de agosto somente para contatos RD com UTM comprovada; filtros internos de origem e exclusão de Importação não são aplicados sem retorno explícito da API.
- [x] Registrar e conciliar separadamente os totais reportados pelo gestor de tráfego com as métricas capturadas por API, identificando período, fontes e critérios antes de qualquer substituição no dashboard.
- [x] Investigar como os totais de leads reportados pelo gestor de tráfego podem ter sido calculados, confrontando período, escopo de campanhas e definição de conversão com os dados de API.
- [x] Analisar o documento do responsável de mídia para confirmar a fórmula de leads, fontes e critérios usados no relatório antes de alterar qualquer métrica exibida.
- [x] Decisão de escopo: não compor a métrica com Meta Instant Forms ou Click-to-WhatsApp; o usuário definiu que o dashboard deve usar somente leads RD Station com UTM.
- [x] Decisão de escopo: não substituir o KPI RD-only pela composição do gestor; o relatório externo permanece documentado e separado, sem mistura de critérios no dashboard.
- [x] Redefinir a métrica de leads de mídia como contatos do RD Station com UTM e cruzá-la por e-mail único com o Bitrix24 para medir chegadas comprovadas ao CRM.
- [x] Decodificar `traffic_source` dos eventos RD Station e cobrir a extração de UTMs com teste automatizado antes de recalcular os leads de mídia.
- [x] Executar as consultas, cruzamentos e validações desta atualização exclusivamente por API, sem depender de interfaces manuais das plataformas.
- [x] Deduplicar eventos RD Station por contato antes do de-para por e-mail, preservando o primeiro evento com UTM de cada lead.
- [x] Documentar na guia de dados que o KPI atual usa UTM comprovada, enquanto os filtros internos de origem da segmentação BRRO não são expostos pela API.
- [x] Documentar em arquivo próprio os caminhos de coleta RD Station utilizados, distinguindo segmentação BRRO, contatos persistidos, sincronização de eventos e rota direta indisponível.
- [x] Validar pelo endpoint analítico exposto os totais RD com UTM e chegada ao Bitrix24; a resposta autenticada confirmou Medsystems 356/58 e BeautySystems 415/63. A checagem HTTP local posterior exige sessão OAuth e retornou 401, sem alterar os dados.
- [x] Entregar o resumo escrito de agosto com leads RD Station com UTM e chegadas confirmadas ao Bitrix24, incluindo corte e regra de evidência.
- [x] Auditar e explicar os identificadores usados no cruzamento RD Station–Bitrix24 e as causas prováveis dos leads sem chegada comprovada ao CRM.
- [x] Auditar telefones e calcular, separadamente, os matches seguros por telefone normalizado entre leads RD com UTM e Bitrix24.
- [x] Consultar por API o detalhe dos contatos RD com UTM para hidratar telefones ausentes antes do cruzamento com os telefones Bitrix24.
- [x] Exportar todos os leads RD Station e Bitrix24 de 01 a 05/08/2026 em abas separadas, sem deduplicação ou cruzamento entre fontes.
- [x] Atualizar as fontes do dashboard até 19/08/2026 exclusivamente por API, preservando contas e marcas separadas.
- [x] Aplicar no dashboard a metodologia documentada de leads de mídia: RD com UTM, Meta Instant Forms e Click-to-WhatsApp somente com opt-in comprovado.
- [x] Nesta atualização, limitar o escopo do dashboard a mídia paga; não atualizar CRM, negócios, receita ou atribuição comercial.
- [x] Aplicar no deck Revenue a análise documentada de leads de mídia, separando RD com UTM, Meta Instant Forms e Click-to-WhatsApp conforme evidência disponível.
- [x] Reconstruir a composição dos 422 leads Medsystems até 19/08 segundo a integração documentada pelo gestor, separando componentes comprovados de componentes não acessíveis.
- [x] Criar uma aba exclusiva de Bitrix24 com leads por dia, origens, negócios, perdas, descartes, cruzamentos comprovados e filtros auditáveis de período, marca e status.
- [x] Criar uma aba exclusiva de RD Station seguindo a metodologia documentada, com leads por dia, UTMs, origens, campanhas, conversões e limitações de evidência explícitas.
- [x] Garantir que a agregação RD Station não exponha nomes ou outros dados pessoais em rótulos de eventos, mantendo somente categorias agregadas seguras.
- [x] Exibir a série diária RD Station no fuso de São Paulo, sem deslocar eventos de 17/08 para 18/08 por conversão UTC.
- [x] Corrigir filtros de Medsystems e BeautySystems para que todas as consultas e abas atualizem exclusivamente com os dados da marca selecionada.
- [x] Ocultar blocos Bitrix24 sem marca comprovada sob filtro de marca e separar UTMs RD que divergem da conta selecionada, sem misturar dados no resultado principal.
- [x] Redesenhar a aba Bitrix24 sob filtro de marca para exibir leads sem marca estruturada em bloco consolidado separado, sem o grande estado visual de indisponibilidade.
- [x] Aplicar o filtro de Medsystems e BeautySystems ao volume de leads Bitrix24 pelo campo explícito Pipeline de Vendas, mantendo valores fora dos pipelines reconhecidos como não identificados.
- [x] Aplicar o Pipeline de Vendas como critério de escopo do volume de leads: Negócios e Redes para BeautySystems e Medsystems para Medsystems.
- [x] Usar a exportação Bitrix24 de 19/08 como referência de campos para validar a atribuição de leads por pipeline e reproduzi-la por API, sem depender da planilha em produção.
- [x] Validar o Overview publicado após o carregamento inicial: as métricas de mídia concluem normalmente no endereço Manus Space e não há bloqueio persistente.
- [x] Reconciliar o volume de leads BeautySystems até 19/08 entre planilha e API, corrigindo a regra do Pipeline de Vendas que retorna zero para a marca; todos os IDs da planilha foram encontrados e 10 leads adicionais atuais da API foram preservados.
- [x] Mapear BeautySystems diretamente pelo rótulo `Negócios e Redes` do Pipeline de Vendas, confirmado pelo usuário e presente na exportação Bitrix24.
- [x] Estender a sincronização Bitrix24 de agosto até 19/08/2026, com tentativas automáticas para instabilidades da API, e refletir o corte na aba operacional.
- [x] Comparar os IDs técnicos da planilha com a API por pipeline, preservando no dashboard os 16 leads adicionais atuais da API sem suprimir dados reais.
- [x] Investigar o horário e possíveis filtros adicionais da exportação Bitrix24 de 19/08/2026: o arquivo não preserva esse critério; a solicitação foi encaminhada ao usuário para eventual refinamento futuro.
- [x] Mapear os campos, categorias e métricas efetivamente disponíveis na aba Base da planilha Bitrix24 enviada, sem inferir dados ausentes.
- [x] Criar uma aba exclusiva “Planilha Bitrix24” com KPIs, gráficos e tabelas baseados somente na exportação enviada.
- [x] Incluir leituras de canais, origens, pipelines, etapas e série diária, sempre com a origem da planilha sinalizada na interface.
- [x] Validar a nova aba com testes de agregação, tipagem, compilação de produção e revisão do estado protegido antes da publicação.
- [x] Remover a barreira de acesso protegido da visualização pública do dashboard, preservando dados agregados e controles sensíveis protegidos.
- [x] Liberar somente as consultas analíticas necessárias para as abas públicas, sem expor credenciais, dados pessoais ou operações administrativas.
- [x] Validar o dashboard sem sessão e publicar a abertura de acesso: Overview e Planilha Bitrix24 carregam métricas agregadas sem cookie de sessão.
- [x] Excluir das visões Bitrix24 e Planilha Bitrix24 os leads classificados como Evento por campos estruturados, sem alterar as demais abas.
- [x] Recalcular o snapshot da planilha após a exclusão de Evento e documentar o novo recorte de volume.
- [x] Adicionar filtro local de Todas as marcas, Medsystems e BeautySystems na aba Planilha Bitrix24.
- [x] Validar os filtros e os totais sem Evento antes de publicar: Medsystems 353 e BeautySystems 648 na planilha; Bitrix24 sem a origem Evento no ranking operacional.
- [x] Verificar o último cursor e a cobertura sincronizada das segmentações BRRO Medsystems e BeautySystems no RD Station.
- [x] Sincronizar contatos e eventos de conversão do RD Station até 20/08/2026 por API, sem misturar contas ou critérios de origem.
- [x] Recalcular as métricas RD do dashboard e atualizar os textos de corte para refletir os retornos confirmados.
- [x] Validar os totais atualizados, tipagem e testes antes de publicar: RD até 20/08 exibido na aba operacional; tipagem aprovada e 49 testes concluídos.
- [x] Registrar e comparar os totais informados pelo gestor para RD Station: Medsystems 451 e BeautySystems 500.
- [x] Apurar a diferença contra o recorte API de primeiro evento com UTM até 20/08: Medsystems 442 e BeautySystems 494.
- [x] Documentar a hipótese de diferença de critério sem substituir os indicadores auditados da API.
- [x] Remover integralmente o conteúdo atual da aba Bitrix24, sem alterar as demais abas do dashboard.
- [x] Filtrar a nova visão exclusivamente por leads cujo Nome do Lead seja `Oportunidade do RD Station`.
- [x] Mapear na API os campos reais de responsável, Informações da fonte, Etapa, Posição, Produto de Interesse e Pipeline de Vendas; nomes sem vínculo unívoco permanecem identificados pelo ID.
- [x] Criar consulta gerencial com total e série diária de leads, rankings e indicadores de qualidade por Pipeline de Vendas.
- [x] Criar filtro local de Pipeline de Vendas que atualize simultaneamente KPIs, gráficos, tabelas e insights da aba Bitrix24.
- [x] Reconstruir a interface Bitrix24 com leitura rápida, gráficos gerenciais, estados vazios auditáveis e responsividade.
- [x] Validar totais, filtros, tipagem, 52 testes, build de produção e visual desktop/mobile antes de publicar.
- [x] Ocultar da navegação pública as abas Revenue, Planilha Bitrix24 e RD Station, preservando seus dados e rotas internas sem exposição no menu.
- [x] Renomear a aba Bitrix24 para Negócios em todos os rótulos e títulos visíveis.
- [x] Implementar filtro configurável de data em Google Ads, Meta Ads e Negócios, usando o mês atual como intervalo padrão.
- [x] Criar na aba Google Ads gráficos de investimento e leads por dia, distribuição de verba por campanha e leituras gerenciais baseadas em dados reais.
- [x] Criar na aba Meta Ads gráficos de investimento e leads por dia, distribuição de verba por campanha e leituras gerenciais baseadas em dados reais.
- [x] Exibir na aba Meta Ads os criativos ativos disponíveis, com filtro por campanha e sem inventar status ou ativos não retornados pelas fontes.
- [x] Permitir filtros cruzados na aba Negócios por data, Pipeline de Vendas, responsável, origem, etapa, posição e produto de interesse.
- [x] Adicionar à aba Negócios a análise de negócios fechados por data e origem, somente quando houver vínculo e campos comerciais comprovados no Bitrix24.
- [x] Incluir melhorias gerenciais pertinentes nas três abas, com estados indisponíveis explícitos quando faltarem dados auditáveis.
- [x] Validar filtros, totais, insights, tipagem, testes e responsividade antes de publicar as atualizações.
- [x] Atualizar dados de RD Station, Bitrix24, histórico de etapas e Google/Meta Ads até o dia anterior ao processamento.
- [x] Validar o corte D-1, totais por fonte/marca e consistência das visões públicas após a sincronização.
- [x] Executar testes focados (56/57 aprovados; callback externo retornou 502 no teste de URL pública), registrar a exceção e publicar o checkpoint da atualização D-1.

- [x] Aplicar à exportação RD Station as regras da documentação anexada: webhook como origem de leads, UTMs preservadas e separação por cliente/conta.
- [x] Atualizar os contatos e eventos RD Station das contas Medsystems e BeautySystems até 24/08/2026.
- [x] Gerar planilha sem duplicatas com todos os leads exportáveis até 24/08/2026, mantendo campos pessoais e de atribuição disponíveis na base.
- [x] Validar contagens, datas, duplicidade e cobertura de UTMs da exportação e entregar o arquivo ao usuário.

- [x] Refazer a exportação RD Station somente de 01/08/2026 a 24/08/2026, usando a última conversão como data de referência e, na ausência, a criação dentro da janela.
- [x] Validar unicidade, datas e totais por conta na exportação de agosto.
- [x] Entregar Excel e CSV do recorte de agosto.

- [x] Cruzar leads Bitrix24 com UTM no período de 01/08/2026 a 24/08/2026 contra contatos e eventos RD Station: 3.568 leads RD, 2.918 encontrados e 650 sem correspondência.
- [x] Classificar matches comprovados, ambiguidades e registros sem evidência suficiente, sem inventar atribuições: 2.915 matches fortes por e-mail/telefone, 3 somente por nome e nenhuma ambiguidade classificada.
- [x] Exportar a base conciliada Bitrix24–RD Station com origem, UTMs e método de match, validando 3.568 chaves únicas.

- [x] Ler o PDF da reunião de alinhamento e extrair o fluxo aprovado entre RD Station e Bitrix24.
- [x] Comparar o fluxo documentado com os campos e registros reais persistidos nas duas fontes.
- [x] Documentar divergências e ajustar o critério do cruzamento de leads de agosto, se necessário.

- [x] Preparar a entrega por e-mail do cruzamento RD Station–Bitrix24 no corte fechado de 01/08/2026 a 23/08/2026.
- [x] Gerar anexos com base RD, matches Bitrix24 e divergências auditáveis.
- [x] Redigir e-mail para revisão, sem enviar antes da confirmação do usuário.

- [x] Filtrar o recorte RD de 01/08/2026 a 23/08/2026 para mídia paga ou UTM comprovada.
- [x] Recalcular os matches Bitrix24 e os totais por conta após o novo filtro.
- [x] Gerar e validar os anexos revisados para envio.

- [x] Exportar leads RD Station com UTM comprovada de 01/08/2026 a 23/08/2026.
- [x] Separar a exportação por Medsystems e BeautySystems e validar unicidade.
- [x] Entregar Excel e CSV da base com UTM.

- [x] Exportar leads Bitrix24 com `SOURCE_DESCRIPTION` explicitamente iniciado por `Paid Search` no período de 01/08/2026 a 23/08/2026.
- [x] Separar a base por pipeline/marca e preservar origem, campanha, UTM e demais campos disponíveis.
- [x] Validar unicidade, contagens e entregar Excel e CSV da base Bitrix24 de mídia paga.

- [x] Configurar atualização diária do dashboard às 09h BRT usando RD Station, Bitrix24 e Windsor/Google/Meta pelas integrações atuais.
- [x] Validar o agendamento ativo: cron diário às 12:00 UTC = 09:00 America/Sao_Paulo, com corte D-1, ROAS por canal quando disponível e registro de exceções.

- [x] Sincronizar manualmente leads, negócios e contatos Bitrix24 até 25/08/2026; o funil usa a etapa atual e documenta explicitamente que não há histórico transicional completo persistido.
- [x] Validar que a maior data persistida do Bitrix24 alcança 25/08/2026 no horário de Brasília: 3.124 leads, 544 negócios no recorte e 554 contatos vinculados atualizados.

- [x] Sincronizar leads, negócios e contatos Bitrix24 e filtrar a fonte registrada como Tráfego Pago até 25/08/2026.
- [x] Separar por tipo e marca, preservando os campos completos de origem e campanha.
- [x] Gerar e validar as exportações Bitrix24 de Tráfego Pago.

- [x] Reconstruir a aba Negócios usando como universo-base os leads Bitrix24 com fonte estruturada `Tráfego Pago`.
- [x] Definir e documentar regras auditáveis para Lead, Qualificado/MQL, SQL e Negócio, sem inferir etapas ausentes.
- [x] Exibir funil visual completo com volumes, taxas de conversão, valores totais e perdas entre etapas.
- [x] Implementar filtros visíveis e combináveis por período, marca/pipeline, etapa, responsável, origem e atribuição.
- [x] Implementar detalhamento de UTM por canal, campanha, conjunto e criativo, usando `Não identificado` quando não houver evidência.
- [x] Adicionar testes Vitest para agregações, filtros, funil e atribuição UTM.
- [x] Validar a nova aba em desktop e mobile antes de publicar.

- [x] Reproduzir e diagnosticar o carregamento infinito da aba Negócios no domínio publicado.
- [x] Reduzir o tempo da consulta do funil de Tráfego Pago sem alterar volumes, valores ou regras de atribuição: de aproximadamente 9,5 s para 991 ms na prévia.
- [x] Exibir estado de erro com opção de tentar novamente quando a consulta falhar ou exceder o tempo esperado.
- [x] Validar o carregamento da aba Negócios no desktop e mobile e publicar a correção.

- [x] Substituir o scrollbar branco da matriz de atribuição por uma barra fina, arredondada e integrada ao tema escuro.
- [x] Validar o scrollbar customizado em desktop e publicar a melhoria visual.

- [x] Fazer o clique em qualquer área dos campos de data da aba Negócios abrir o calendário nativo e deixar o ícone branco.
- [x] Redesenhar a aba Overview no mesmo padrão visual premium, hierárquico e gerencial da aba Negócios.
- [x] Redesenhar a aba Google Ads com filtros, KPIs, gráficos e distribuição de verba no mesmo sistema visual da aba Negócios.
- [x] Redesenhar a aba Meta Ads com filtros, KPIs, gráficos, distribuição de verba e criativos no mesmo sistema visual da aba Negócios.
- [x] Criar e reutilizar padrões compartilhados para cabeçalhos, filtros de data, cards, painéis e estados de carregamento/erro.
- [x] Validar Overview, Google Ads, Meta Ads e Negócios em desktop e mobile, incluindo build e testes, antes de publicar.

- [x] Alterar o agendamento diário do dashboard de 09h para 08h no horário de Brasília.
- [x] Confirmar que a rotina atualiza RD Station, Bitrix24, Google Ads e Meta Ads com corte D-1 e gera um resumo após a execução.
- [x] Validar o status ativo e o próximo horário do agendamento após a alteração: cron `0 0 11 * * *`, equivalente a 08h BRT.

- [x] Criar autenticação própria por usuário e senha com sessão segura para proteger todo o dashboard.
- [x] Cadastrar `rodrigo` como administrador e `medsystems`, `patrick` e `Isadora` como clientes, armazenando somente hashes das senhas.
- [x] Impedir que usuários não autenticados acessem as consultas agregadas do dashboard.
- [x] Criar tela de login responsiva com estados de carregamento, erro e logout.
- [x] Criar área exclusiva do administrador com log de tentativas e acessos, usuário, data, resultado, IP e agente do navegador quando disponíveis.
- [x] Adicionar testes de login, sessão, autorização e acesso administrativo.
- [x] Validar os quatro acessos, as permissões de cliente/administrador e publicar a proteção.
- [x] Usar os logos fornecidos de MedSystems e BeautySystems na tela de login, com símbolo `+` entre eles e fundo branco.

- [x] Auditar o investimento Meta Ads até D-1 após o gestor reportar aproximadamente R$ 115 mil, quase o dobro do valor real.
- [x] Auditar a diferença de aproximadamente R$ 612 a menos no Google Ads usando o mesmo período, contas e moeda do gestor; o valor exato do gestor não foi fornecido, e a referência canônica ficou documentada por conta.
- [x] Identificar duplicidades por granularidade, contas, campanhas, anúncios, datas ou cargas repetidas na base normalizada de mídia.
- [x] Corrigir a importação/agregação de investimento sem apagar dados brutos e criar testes de reconciliação por plataforma.
- [x] Recalcular Overview, Google Ads e Meta Ads e validar os valores no dashboard publicado.

- [x] Executar a atualização diária de 27/08/2026 com corte D-1 até 26/08/2026 para RD Station, Bitrix24, Google Ads e Meta Ads.
- [x] Validar datas máximas, totais por fonte, investimento por marca e registrar exceções da execução diária.

- [x] Produzir relatório executivo em PDF de até 6 slides com evolução Lead→MQL→SQL mês a mês, conversão por BU, comparação com média, uso da verba, indicativos utilizados, pontos de efeito e demandas registradas pela Isa.
- [x] Consolidar dados auditáveis e validar as métricas antes de gerar o deck e exportar o PDF.
- [x] Revisar visualmente o deck, exportar o PDF e entregar o arquivo final ao usuário.

## Contexto da demanda da Isa

- [x] Comparar quanto era investido antes versus quanto está sendo investido agora.
- [x] Comparar leads do mês passado versus o mês atual e relacionar a variação com a verba.
- [x] Considerar que campanhas de hyperlocal e push foram programadas para rodar até o dia 29.
- [x] Registrar a urgência de retorno do relatório mencionada na conversa compartilhada.


- [x] Refazer o relatório executivo usando exclusivamente dados do RD Station, removendo Bitrix24 e mídia dos cálculos.
- [x] Revalidar os volumes, taxas Lead→MQL→SQL e comparação mensal por BU diretamente na base RD Station.
- [x] Revisar o layout dos seis slides, melhorando hierarquia, legibilidade, consistência e notas metodológicas.
- [x] Apresentar e entregar a nova versão revisada do relatório.


- [x] Ler e aplicar a documentação dashboard-leads-como-os-dados-sao-puxados.docx como parâmetro oficial da revisão do relatório RD Station.
- [x] Revisar os cálculos do relatório conforme os filtros e critérios descritos na documentação.


- [x] Incorporar na apresentação os dados e observações das imagens enviadas sobre comparação de verba, leads e evolução semanal.
- [x] Remover o slide de limitações e substituí-lo por uma síntese executiva final.
- [x] Revisar a coerência visual e numérica da nova sequência de slides antes da entrega.


- [x] Acessar os três relatórios Publya e validar os três formatos de programática em execução.
- [x] Adicionar dois slides sobre programática, formatos e estratégia de geolocalização de eventos.
- [x] Registrar Quanta Academy em 27/08 e BOT em 28–29/08 na narrativa operacional.
- [x] Apresentar e entregar a apresentação atualizada com os novos slides.


- [x] Integrar explicitamente no relatório executivo os dados de programática da Publya e o plano de geolocalização já levantados.
- [x] Atualizar o resumo final do executivo para refletir programática, Quanta Academy em 27/08 e BOT em 28–29/08.
- [x] Apresentar e entregar a versão executiva atualizada.


- [x] Extrair e validar os portais de maior impacto no relatório programático da Publya.
- [x] Inserir o ranking de portais no slide de programática, mantendo todas as legendas na mesma escala visual.
- [x] Revisar e apresentar a versão atualizada do relatório.


- [x] Revisar e corrigir o documento executivo antes do reenvio, mantendo o ranking de portais e as legendas padronizadas.
- [x] Reenviar o documento executivo atualizado. ao usuário.


- [x] Criar usuário cliente `luiza` com senha protegida e acesso ao dashboard.
- [x] Confirmar no banco o corte mais recente de RD Station, Bitrix24, Google Ads e Meta Ads.
- [x] Validar o login criado e salvar a alteração publicada.


- [x] Alterar o título do site para `Medsystems - Gerencial` e validar a publicação.
- [x] Inserir favicon com o logo da MedSystems e validar o título `Medsystems - Gerencial` junto aos metadados do site.

- [x] Registrar com segurança as credenciais da API Publya e validar a troca do token temporário.
- [x] Mapear os endpoints e campos oficiais de campanhas, formatos, portais e desempenho programático.
- [x] Criar armazenamento e sincronização idempotente dos dados Publya com corte D-1.
- [x] Criar a aba Programática com filtros por período e campanha, KPIs, evolução, formatos e portais.
- [x] Integrar a Publya à atualização diária das 08h BRT e documentar a data real de cobertura.
- [x] Adicionar testes Vitest, validar desktop/mobile, build e publicar a nova versão.
- [x] Verificar acesso autenticado ao portal Publya e gerar um novo token temporário de uso único.
- [x] Trocar o novo token temporário uma única vez e armazenar o token permanente com segurança.
- [x] Trocar o token temporário Publya recebido em 28/08/2026 e validar o token permanente por listagem de campanhas.
- [x] Executar a primeira sincronização Publya com corte D-1 e reconciliar campanhas, investimento, formatos, criativos e portais.
- [x] Validar a nova aba Programática com os dados coletados e ativar sua rotina diária às 08h BRT.
- [x] Consultar a documentação oficial em `docs.publya.com` para confirmar validade, reutilização e regeneração do token temporário.
- [x] Documentar o endpoint-base, headers obrigatórios e operações oficiais necessárias para alimentar a aba Programática.

- [x] Formalizar a atualização diária às 08h BRT com corte D-1 até 23h59 para RD Station, Bitrix24 e Windsor.ai.
- [x] Restringir Meta Ads às contas `446269251699575` e `1655942005167160` e Google Ads às contas `672-710-7654` e `864-759-2401`, todas em BRL.
- [x] Validar que a persistência de mídia usa chave canônica `plataforma + conta + data + campaign_id`, com `adGroupId` e `adId` vazios não nulos e upsert idempotente.
- [x] Validar que os KPIs usam somente a versão mais recente de cada chave e nunca combinam snapshots históricos, campanha e anúncio.
- [x] Preservar as regras atuais de marca, origem, funil e atribuição de RD Station e Bitrix24.
- [x] Confirmar datas máximas, totais por fonte, investimento Windsor por conta e registrar fontes que não alcancem D-1.
- [x] Entregar resumo diário com status, datas sincronizadas, investimento Google/Meta por marca e exceções.

- [x] Validar os quatro relatórios B2B da Publya mostrados na captura: PMAX, Meta e duas campanhas de Programática Display.
- [x] Ajustar a aba Programática para listar os quatro relatórios com plataforma, objetivo, período, status e métricas separados.
- [x] Recalcular os totais sem excluir PMAX/Meta e sem duplicar snapshots inconsistentes das duas campanhas DV360.
- [x] Revisar desktop/mobile, executar testes e publicar a correção dos quatro relatórios.

- [x] Validar o link Push Publya e identificar as métricas disponíveis para atualização D-1.
- [x] Persistir a associação dos quatro links oficiais aos respectivos relatórios PMAX, Meta e Programática Display.
- [x] Incorporar Push ao modelo de dados e à sincronização diária das 08h BRT sem estimar métricas ausentes.
- [x] Criar overview geral combinando somente métricas comparáveis e filtro individual por Push/campanha/relatório.
- [x] Exibir data de cobertura e status de atualização de cada fonte no overview.
- [x] Revisar desktop/mobile, executar testes e publicar a versão completa.

- [x] Auditar leads, conversões, alcance, frequência, portais, formatos e criativos disponíveis separadamente nos cinco relatórios Publya.
- [x] Personalizar Meta com leads e CPL e PMAX com conversões e custo por conversão, usando somente métricas retornadas pela fonte.
- [x] Personalizar Display Geolocalização com alcance, frequência, portais, formatos e criativos e Display Conversões com conversões e custo por conversão.
- [x] Personalizar Push com disparos, cliques, CTR, custo por disparo e evolução diária.
- [x] Manter overview geral com métricas comparáveis e tornar títulos, KPIs, gráficos e rankings dinâmicos conforme o filtro.
- [x] Executar testes, validar desktop/mobile e publicar a personalização por frente.

- [x] Detectar diariamente leads Bitrix24 sem marca estruturada e agrupá-los por pipeline, campanha, origem e período.
- [x] Classificar ocorrências como `mapeamento pendente`, sem inferir marca automaticamente; destacar o pipeline `20889` e a campanha `medical-dsb-conversao-lead-ads`.
- [x] Decisão do usuário: não persistir fila ou histórico de resolução; usar somente o resumo diário simples.
- [x] Integrar a verificação ao Heartbeat D-1 existente das 08h BRT, sem criar um segundo job.
- [x] Decisão do usuário: não criar fila administrativa de mapeamentos nesta etapa.
- [x] Decisão do usuário: não criar alerta separado; incluir os resultados somente no resumo D-1.
- [x] Validar a execução D-1 por consulta agregada e confirmar a rotina ativa das 08h BRT.

- [x] Validar os números fornecidos pela gerência para MedSystems, BeautySystems, consolidado e verba, registrando a origem de cada indicador.
- [x] Consolidar programática, Push e ativações Quanta Academy/BOT com dados auditáveis do dashboard.
- [x] Preparar PPT executivo com comparação de leads, SQL, conversões, descartes, verba e eficiência.
- [x] Inserir logos do cliente e da BBRO com qualidade adequada e layout executivo.
- [x] Criar slide final com prioridades de setembro: produtos, B2C/Awareness, antipirataria e novos protocolos.
- [x] Revisar o deck, apresentar e entregar a versão final em PPTX/PDF.

- [x] Auditar cada número do PPT executivo contra RD Station, Bitrix24, Windsor.ai e Publya, registrando fonte, período e regra de cálculo.
- [x] Remover ou isolar qualquer valor fornecido pela gerência que não possa ser reconciliado com as fontes integradas.
- [x] Atualizar todas as fontes até o último corte D-1 disponível e registrar exceções de cobertura.
- [x] Recalcular leads, MQL, SQL, descartes, conversões, investimento e eficiência por BU com critérios únicos e reproduzíveis.
- [x] Refazer a narrativa para um CEO global, com conclusões objetivas, riscos, decisões e prioridades de setembro.
- [x] Revisar o layout executivo, validar os números slide a slide e entregar uma nova versão em PPTX/PDF.

- [x] Auditar o Heartbeat diário das 08h BRT e confirmar corte D-1 até 23h59 de Brasília para RD Station, Bitrix24 e Windsor.ai.
- [x] Garantir que a mídia permaneça restrita às quatro contas oficiais em BRL, com upsert e leitura pela chave canônica no nível campanha.
- [x] Alinhar a verificação de leads sem marca ao universo exato da aba Negócios e à regra de campanha UTM/payload RD.
- [x] Separar no resumo diário casos novos D-1 e acumulado mensal, agrupados por pipeline, campanha e origem, sem dados pessoais.
- [x] Destacar pipeline 20889 / Consumíveis e campanha medical-dsb-conversao-lead-ads como mapeamento pendente de DSB e BU.
- [x] Validar agendamento, execução, datas máximas, investimentos por marca e exceções; publicar a rotina atualizada.

- [x] Reduzir o relatório a três slides com o título `Report executivo MedSystems + BeautySystems` e referência discreta a agosto.
- [x] Apresentar investimento, linhas de negócio e avanços positivos de impacto, cliques e leads usando somente dados auditados.
- [x] Explicar didaticamente que a mensuração comercial ainda depende da integração e classificação no CRM, sem atribuir culpa sem evidência.
- [x] Mostrar as soluções em andamento para reconciliação RD→Bitrix, classificação de marca e monitoramento diário.
- [x] Reservar o último slide para as prioridades e entregas do próximo mês.
- [x] Revisar o deck para audiência executiva, validar os números e entregar a versão final em PPTX/PDF.
- [x] Incluir na execução de 31/08/2026 às 08h BRT um lembrete para alinhar o relatório didático com a Luiza e compartilhá-lo no grupo MedSystems.

- [x] Validar a quantidade real de leads adicionais em agosto versus julho antes de substituir qualquer referência a “+40”.
- [x] Explicar a distribuição do investimento e a relação entre mídia, impacto, cliques e leads em linguagem não técnica.
- [x] Incluir cronologia das campanhas ativadas entre 25 e 27/08 e registrar a premissa operacional de 7–15 dias úteis para maturação.
- [x] Atualizar somente o slide de agosto, preservando o slide de setembro aprovado.
- [x] Revisar e entregar novamente o relatório de três slides.

- [x] Reconciliar por BU o investimento de Google, Meta e Programática no mesmo período de comparação.
- [x] Recalcular leads, MQL, conversão MQL→SQL, CPL e crescimento de julho para agosto por MedSystems e BeautySystems.
- [x] Validar o investimento Keep It Real em fonte auditável antes de incluí-lo; se não houver fonte, registrar como indisponível.
- [x] Reestruturar o relatório final com uma tabela executiva por BU e metodologia de cálculo explícita.
- [x] Revisar os três slides e entregar a versão reconciliada em PPTX/PDF.

- [x] Consultar no Windsor.ai campanhas com `keep-it-real-` nas contas oficiais MedSystems e BeautySystems.
- [x] Reconciliar investimento e resultados Keep It Real por conta, canal e período, sem inferir campanhas ausentes.
- [x] Estruturar um slide exclusivo de Programática por camadas: conversão, awareness, geolocalização, Push e ativações de eventos.
- [x] Explicar didaticamente a função de cada camada e como os investimentos se complementam.
- [x] Preservar a estrutura do slide 2 e inserir o novo slide separadamente.
- [x] Revisar e entregar a apresentação atualizada em PPTX/PDF.

- [x] Atualizar até hoje Windsor.ai, Bitrix24/RD Station, Publya e Keep It Real, registrando o horário de extração.
- [x] Separar nos cálculos e slides dados fechados D-1 de valores parciais do dia corrente.
- [x] Recalcular investimento, leads, MQL, conversão, CPL e crescimento por BU no maior corte comparável disponível.
- [x] Atualizar o slide exclusivo de Programática com as camadas e os valores mais recentes.
- [x] Revisar e entregar a apresentação com os novos cortes e ressalvas de atualização.

- [x] Revalidar a regra RD para identificar mídia paga por UTM comprovada ou página/formulário de mídia.
- [x] Calcular contatos únicos de agosto por MedSystems e BeautySystems, separando UTM, página e sobreposição.
- [x] Validar a deduplicação por contato e entregar o total auditável com período e critérios explícitos.

- [x] Atualizar contatos e eventos RD Station até o D-1 de 30/08/2026 nas duas contas.
- [x] Recalcular julho e agosto com o critério de contato único por UTM paga ou página/formulário comprovadamente de mídia.
- [x] Atualizar no report o volume de leads, crescimento e CPL derivados desse critério, preservando as demais métricas por fonte.
- [x] Revisar e entregar a nova versão da apresentação com corte e metodologia explícitos.

- [x] Atualizar o corte das fontes e reconciliar valor gasto, leads, MQL e crescimento de julho para agosto por BU e consolidado.
- [x] Comparar os números informados pela gestão com RD Station, Bitrix24, Windsor.ai e Publya e remover divergências não comprovadas.
- [x] Atualizar o slide de agosto com as quatro métricas exigidas, período comum e fontes explícitas.
- [x] Manter os números de meta somente quando houver fonte e regra de cálculo documentadas.
- [x] Revisar e entregar a versão executiva atualizada.

- [x] Ajustar o acesso da cliente `isadora` para login em minúsculas e senha protegida, preservando todos os demais usuários.
- [x] Validar o login da cliente `isadora`, a função de cliente e a integridade da lista de usuários existente.

- [x] Calcular a divisão dos R$ 100 mil entre MedSystems e BeautySystems conforme as proporções atuais de Google e Meta.
- [x] Estruturar no Excel os blocos de R$ 58.836 e R$ 41 mil, com canais, objetivos, percentuais e premissas explícitas.
- [x] Criar resumo executivo, plano detalhado, premissas editáveis e gráficos do plano de mídia.
- [x] Validar fórmulas, totais, formatação e entregar a planilha final.

- [x] Atualizar RD Station e Bitrix24 até 01/09/2026, preservando as regras atuais de marca, mídia paga e deduplicação.
- [x] Atualizar Google Ads e Meta Ads nas quatro contas oficiais até 01/09/2026 com reconciliação canônica e ROAS quando houver receita atribuída válida.
- [x] Atualizar os cinco relatórios Publya/Push até 01/09/2026 sem duplicar snapshots de Display.
- [x] Validar a data máxima, os totais D-1, o acumulado mensal e as exceções de cobertura de cada fonte.
- [x] Revisar testes, publicar o dashboard e enviar o resumo da atualização, incluindo leads de 01/09.

- [x] Escopo adiado pelo usuário em 02/09/2026: não mapear agora as dependências de hospedagem, dados, autenticação e integrações para a BBRO.
- [x] Escopo adiado pelo usuário em 02/09/2026: não definir agora a arquitetura externa nem substituir a rotina diária D-1.
- [x] Escopo adiado pelo usuário em 02/09/2026: não preparar agora configuração de produção, banco, domínio ou plano de reversão externo.
- [x] Escopo adiado pelo usuário em 02/09/2026: não executar agora homologação ou corte para a hospedagem BBRO.

- [x] Investigar a divergência de 01/09 entre os 39 leads MedSystems e 45 BeautySystems informados pelo gestor e o volume auditado no dashboard.
- [x] Reconstituir a contagem por fonte, janela horária, UTM, página/formulário, importação e contatos únicos, sem expor PII.
- [x] Documentar a divergência e aplicar a decisão segura: manter MedSystems em 41 na fonte, exibir 39 como número informado pelo gestor e não excluir dois registros sem filtro comprovado.

- [x] Inspecionar a base enviada de MedSystems e BeautySystems, preservando PII fora de saídas e documentos.
- [x] Construir um de-para por chaves disponíveis, marca, origem, UTM, página/formulário e data de conversão.
- [x] Comparar os totais da base com RD Station, Bitrix24 e métricas de plataforma, identificando divergências verificáveis.
- [x] Definir e implementar o padrão de contagem de leads correto no dashboard após validação com a base de referência.

- [x] Criar uma estrutura persistente e auditável para importar os registros da base de referência sem depender do arquivo CSV em produção.
- [x] Implementar o de-para de `client_slug`, canal e data em America/Sao_Paulo, preservando origem desconhecida e divergências de BU.
- [x] Adicionar ao dashboard uma visão de conciliação com volume da fonte, contatos únicos, origem identificada, desconhecida e comparação com o gestor.
- [x] Incluir filtros por data, BU e canal, com detalhamento agregado por campanha e evento de conversão.
- [x] Cobrir as novas regras com testes Vitest e validar a interface em desktop e mobile antes da publicação.

- [x] Identificar e documentar que os números 50/41/9 da aba Negócios representam registros Bitrix24, não o volume reconciliado da fonte de leads.
- [x] Integrar na aba Negócios os volumes reconciliados de 86 total, 41 MedSystems e 45 BeautySystems no recorte de 01/09.
- [x] Exibir lado a lado fonte de leads, volume no Bitrix24 e diferença de integração, sem substituir métricas de fontes distintas.
- [x] Ajustar os rótulos do filtro de pipeline/marca para explicitar que suas contagens são do Bitrix24.
- [x] Validar a correção com testes, build e revisão visual antes de publicar.

- [x] Registrar que a migração para a hospedagem BBRO foi adiada pelo usuário e não deve ser executada no escopo atual.

- [x] Investigar o erro 503 `Service Unavailable` que impede o carregamento da aba Negócios em produção.
- [x] Identificar se a falha ocorre na consulta principal Bitrix24, na consulta-base de pipelines ou na conciliação de leads.
- [x] Tornar as consultas auxiliares da conciliação não bloqueantes para que uma falha parcial não derrube o funil comercial.
- [x] Melhorar a mensagem de erro para não exibir falha técnica de parsing JSON ao usuário final.
- [x] Validar a correção no domínio publicado, executar testes e salvar nova versão.

- [x] Remover da aba Negócios o bloco separado `Fonte de referência × pessoas × CRM` e o botão de análise completa.
- [x] Cruzar os hashes de identidade da base de referência com leads e contatos do Bitrix24 no mesmo período.
- [x] Incluir no universo do funil os registros encontrados por identidade mesmo quando a origem do Bitrix24 estiver classificada de outra forma.
- [x] Resolver a marca do registro reconciliado pela BU da referência quando a marca/pipeline do Bitrix24 estiver ausente ou divergente, preservando a origem original para auditoria.
- [x] Recalcular Pipeline / marca no CRM, funil, filtros e atribuições exclusivamente com registros Bitrix24 conciliados.
- [x] Validar os novos totais contra a referência de 01/09, executar testes e publicar a correção.

- [x] Auditar quantas linhas e quantas pessoas únicas do CSV de 01/09 possuem match no Bitrix24 por e-mail, telefone ou UUID do RD Station.
- [x] Separar os matches encontrados em 01/09, em outras datas e em múltiplos registros do CRM.
- [x] Informar os volumes por MedSystems e BeautySystems, preservando PII fora das saídas.
- [x] Documentar a diferença entre linhas do CSV, pessoas únicas e registros Bitrix24 encontrados.

- [x] Validar as colunas e o recorte temporal do CSV reenviado sem expor PII.
- [x] Resolver os casos ambíguos usando nome normalizado combinado com telefone, além de e-mail e UUID.
- [x] Quantificar por BU os matches no mesmo dia, em outras datas, duplicados e não localizados.
- [x] Atualizar a conclusão auditável e informar se os 86 registros existem no Bitrix24.

- [x] Etapa intermediária concluída e supersedida: documentar a leitura por IDs únicos de lead Bitrix24 antes da decisão final por contato único.
- [x] Revisar e registrar os campos/filtros Bitrix24 usados para título, origem paga, pipeline/marca, data, etapa e vínculos de negócio.
- [x] Manter conversões da fonte, pessoas únicas, IDs Bitrix24 e duplicidades como métricas separadas em todos os relatórios.
- [x] Aplicar a mesma regra em qualquer período consultado e na execução diária D-1, sem depender de um CSV específico.

- [x] Etapa intermediária concluída e supersedida: formalizar o ID Bitrix24 antes da decisão final de usar contato único como unidade oficial.
- [x] Criar estrutura persistente para registrar a conciliação diária D-1 e os casos com múltiplos IDs de lead.
- [x] Implementar serviço idempotente de conciliação RD/Bitrix por e-mail, telefone, nome + telefone e UUID, sem retornar PII ao navegador.
- [x] Integrar a conciliação ao fluxo diário das 08h BRT após as cargas RD e Bitrix24, com snapshot às 08h30 BRT.
- [x] Etapa intermediária concluída e supersedida: adicionar KPI por ID Bitrix24 antes de migrá-lo para contato único, mantendo os IDs apenas como contexto de duplicidade.
- [x] Validar o recorte de 01/09, os testes, o agendamento, a responsividade e publicar a nova versão.

- [x] Validar as colunas, o recorte e as BUs do CSV reenviado antes do cruzamento com o RD Station.
- [x] Cruzar os registros com contatos RD por UUID, e-mail e telefone normalizado nas duas contas.
- [x] Confirmar as conversões correspondentes no RD e separar repetições da mesma pessoa.
- [x] Informar matches e ausências por MedSystems e BeautySystems sem expor PII.

- [x] Mapear, nos 86 registros do CSV encontrados no Bitrix24, o comportamento de título, origem, pipeline, data, etapa, campanha e campos de identidade.
- [x] Definir o universo Bitrix24 pela correspondência com o padrão do CSV, sem usar título, origem, pipeline ou data como filtros excludentes isolados.
- [x] Alterar o KPI oficial do funil de ID de lead para contato único conciliado, mantendo 86 conversões e 75 pessoas como métricas distintas.
- [x] Atualizar a conciliação diária e a interface para que a deduplicação por contato seja a única diferença entre fonte e Bitrix24.
- [x] Validar MedSystems 41→35 e BeautySystems 45→40 no recorte de 01/09, executar testes e publicar.

- [x] Mapear campos históricos de leads, contatos e negócios Bitrix24 para julho e agosto de 2026, incluindo origem, UTMs, funil, descarte e fechamento.
- [x] Extrair e reconciliar os registros históricos com uma linha por ID de lead, preservando IDs técnicos e removendo PII desnecessária.
- [x] Gerar workbook profissional com Overview, base detalhada, negócios vinculados e dicionário/metodologia.
- [x] Validar período, totais, fórmulas, filtros, legibilidade e ausência de PII; documentar a cobertura histórica real.
- [x] Preparar a entrega final do arquivo Excel, com resumo de cobertura e limitações auditáveis.

- [x] Confirmar o perfil e as permissões atuais do usuário `rodrigo` como referência para o novo acesso.
- [x] Criar o usuário `daniel` com senha protegida e as mesmas permissões administrativas de `rodrigo`.
- [x] Validar o cadastro e o acesso do usuário `daniel` sem expor senha ou hash; 7 testes de autenticação aprovados e scripts temporários removidos.

- [x] Auditar a rotina diária das 08h BRT e a conciliação posterior, comparando código, contrato, jobs ativos e ordem das cargas.
- [x] Confirmar o corte D-1, as quatro contas oficiais em BRL, a chave canônica de campanha, upsert e seleção da versão mais recente.
- [x] Confirmar a verificação de leads sem marca com pipeline 20889/Consumíveis e campanha `medical-dsb-conversao-lead-ads` como mapeamento pendente; 0 novos e 0 no acumulado de 01–02/09.
- [x] Confirmar o snapshot `bitrix_unique_contact_v2`, contato único como KPI e auditoria separada de IDs Bitrix24 duplicados sem PII.
- [x] Corrigir somente divergências comprovadas, executar testes e validar os agendamentos ativos; Heartbeat movido para 09h BRT e 27 testes aprovados.
- [x] Preparar o relatório operacional final, incluindo limitações, defasagens de fonte e a nova sequência 08h/09h BRT.

- [x] Corrigir a causa do OOM/HTTP 503 do Heartbeat `paid-media-reconciliation`, sem alterar a regra source-first ou criar outro agendamento.
- [x] Reduzir a leitura Bitrix24 do snapshot diário ao conjunto de leads candidatos às identidades D-1, preservando contatos e negócios vinculados.
- [x] Adicionar testes de regressão para o caminho de reconciliação otimizado e validar o callback publicado; 28 testes aprovados e callback HTTP 200 em aproximadamente 5 segundos.
- [x] Confirmar execução bem-sucedida do job único das 09h BRT e reportar o resultado sem PII; cron restaurado para `0 0 12 * * *` UTC.

- [x] Atualizar RD Station e Bitrix24 com corte D-1 de 03/09/2026 e persistir o snapshot `bitrix_unique_contact_v2` após as cargas.
- [x] Atualizar Google Ads nas duas contas oficiais pelo Windsor.ai com upsert canônico e validar ausência de duplicação por campanha.
- [x] Registrar Meta Ads como não atualizado em 03/09 por expiração da autorização da fonte no Windsor.ai, preservando 02/09 como última data válida e sem imputar zeros.
- [x] Validar leads sem marca no D-1 e no acumulado de setembro; ambos ficaram em zero.
- [x] Preparar o resumo diário sem PII com cobertura, investimentos, leads, funil e exceções.

- [x] Escopo de 04/09 supersedido pela atualização acumulada concluída até 06/09/2026, preservando regras de marca, funil e atribuição.
- [x] Escopo de mídia de 04/09 supersedido pela carga Windsor acumulada concluída até 06/09 nas quatro contas oficiais.
- [x] Validar chave canônica, leads sem marca D-1/MTD e snapshot `bitrix_unique_contact_v2` sem PII; validação concluída até 06/09.
- [x] Entregar o resumo diário originalmente previsto para 05/09; supersedido pelo resumo acumulado de 07/09 com corte em 06/09.
- [x] Corrigir a reconciliação de registros Bitrix24 para usar a data original de criação convertida ao fuso de Brasília e remover somente IDs ausentes após paginação integral validada.

- [x] Atualizar RD Station e Bitrix24 no acumulado de 01–06/09/2026, com 434 leads, 334 contatos e 100 negócios retornados pelo CRM.
- [x] Atualizar Google Ads e Meta Ads de 01–06/09 nas quatro contas oficiais, com 156 chaves canônicas únicas e R$ 22.675,66 investidos.
- [x] Persistir o snapshot de 06/09 e recalcular o acumulado sem somar contatos repetidos: 44 contatos pagos D-1 e 75 contatos pagos MTD.
- [x] Validar leads sem marca em 06/09 e no acumulado de setembro; ambos ficaram em zero.
- [x] Preparar resumo diário e mensal sem PII, incluindo a execução prematura do callback das 09h como exceção operacional.

- [x] Auditar a execução automática e a cobertura de RD Station, Bitrix24, Google Ads e Meta Ads para o corte D-1 de 07/09/2026.
- [x] Atualizar somente as fontes incompletas, preservando upsert, quatro contas oficiais e granularidade de campanha.
- [x] Persistir o snapshot `bitrix_unique_contact_v2` de 07/09 e recalcular o acumulado de setembro sem somar snapshots diários.
- [x] Validar leads sem marca no D-1 e no acumulado mensal, mantendo pipeline 20889/DSB como mapeamento pendente; ambos ficaram em zero.
- [x] Executar testes, publicar e entregar o resumo diário sem PII, com investimento por BU e exceções de cobertura; 31 testes, TypeScript e build aprovados.

- [x] Revalidar a cobertura de RD Station, Bitrix24, Google Ads, Meta Ads e snapshot no corte D-1 de 07/09/2026.
- [x] Atualizar somente eventuais lacunas, preservando upsert e impedindo duplicação de campanhas, contatos e snapshots; nenhuma nova carga foi necessária.
- [x] Confirmar leads do dia anterior, investimento por BU, leads sem marca e exceções; publicar e entregar o resumo diário.

- [x] Analisar a capa real `cover.xml`, o outline e os demais slides do Report Executivo para preservar o sistema visual existente.
- [x] Atualizar a capa em uma única reescrita completa para comunicar agosto fechado, sem alterar estrutura ou identidade de marca.
- [x] Registrar o modelo visual e editorial como `Report Lu` na memória compartilhada do projeto para reutilização futura.
- [x] Validar a apresentação completa e reapresentar todos os quatro slides na ordem original.

- [x] Auditar todos os textos, datas e métricas dos quatro slides do Report Lu para identificar referências anteriores a 31/08/2026.
- [x] Validar nas fontes e documentos auditados os números fechados de agosto antes de atualizar qualquer métrica.
- [x] Alterar somente textos e valores necessários nos quatro slides, preservando exatamente posições, dimensões, cores, fontes, logos e estrutura.
- [x] Validar e reapresentar o deck completo com fechamento em 31/08/2026.

- [x] Mapear campanhas ativas, investimento, resultados e cobertura de setembro por MedSystems e BeautySystems.
- [x] Calcular projeção de leads até o fim de setembro com premissas explícitas e dados reais até o último D-1.
- [x] Produzir um PDF no formato Report Lu com campanhas, verba, resultados e projeção por BU.
- [x] Validar visualmente o PDF, documentar metodologia, salvar a versão e entregar o arquivo.

- [x] Atualizar o Report Lu com os leads RD informados: 179 MedSystems e 212 BeautySystems, mantendo a definição visível no material.
- [x] Validar a cobertura e a verba de programática disponível para o período, sem usar snapshots sobrepostos ou estimar gasto ausente.
- [x] Calcular CPL por BU com investimento Google + Meta e leads RD informados, deixando premissas e limitações explícitas.
- [x] Atualizar, validar, exportar e entregar o PDF revisado no formato Report Lu.

- [x] Validar no dashboard/Publya as métricas e a cobertura de programática que entrarão na lâmina exclusiva: 2 campanhas ativas, dados até 07/09, 9.425 impressões, 227 cliques e 24 conversões; verba financeira N/D.
- [x] Adicionar uma lâmina exclusiva de Programática ao Report Lu, mantendo o modelo visual e sem inventar verba indisponível.
- [x] Validar o deck, exportar o PDF atualizado e entregar a versão revisada.

- [x] Diagnosticar e corrigir a referência do logo BeautySystems na capa do Report Lu sem alterar o layout.
- [x] Validar visualmente o logo corrigido, reexportar e reenviar o PDF final.

- [x] Mapear critérios vigentes de BU, pipelines e período para a revisão de leads Bitrix24.
- [x] Auditar leads Bitrix24 por pipeline, marca, origem, data e duplicidade técnica sem PII.
- [x] Confrontar a classificação do Bitrix24 com a referência RD source-first e documentar divergências por BU.
- [x] Corrigir somente mapeamentos comprovados, validar o dashboard e publicar o diagnóstico por BU.

- [x] Definir e documentar o universo de leads de marketing Bitrix24 até o último D-1 por BU e canal.
- [x] Apurar volumes por canal, investimento acumulado e CPL de mídia paga por BU sem misturar métricas de fonte.
- [x] Criar um Report Lu com lâmina exclusiva de canais de lead Bitrix24 e indicadores de CPL por BU.
- [x] Validar o deck e entregar o relatório sem PII.

- [x] Formalizar as metas de setembro por BU e componente: mídia paga, outras origens, eventos e nova meta estimada.
- [x] Calcular realizado, ritmo esperado, pacing, desvio e projeção de setembro por BU sem misturar a unidade de leads Bitrix24.
- [x] Atualizar o Report Lu com lâmina detalhada de canais e leitura de pacing contra as metas fornecidas.
- [x] Validar, exportar e entregar o PDF final atualizado, sem PII.

- [x] Reproduzir o universo de leads de marketing usado no Report Lu de 01–07/09/2026 e confirmar as regras de inclusão.
- [x] Auditar leads Bitrix24 potencialmente excluídos por pipeline sem BU, pipeline 20889, origem/canal não classificado ou campos de marketing incompletos.
- [x] Confrontar os casos não atribuídos com a evidência RD e classificar somente os que tiverem BU comprovada, sem PII.
- [x] Atualizar volumes, pacing, CPL e o Report Lu após comprovar a omissão causada pelo filtro de título exato.
- [x] Validar, documentar, publicar e entregar a conclusão da auditoria de não atribuídos.

- [x] Aplicar `RD Station = sim` como critério de inclusão de lead de marketing, independentemente do título exato no Bitrix24.
- [x] Recalcular leads e canais com pipeline 15391 = MedSystems, 15395 = BeautySystems e 20889 separado como não atribuído.
- [x] Atualizar pacing, projeção e CPL por BU com o universo corrigido e investimento até 07/09/2026.
- [x] Atualizar e validar o Report Lu, destacando os 25 leads não atribuídos sem inferir BU.

- [x] Descartar no novo relatório todos os critérios anteriores de fonte, título, UTM e evidência RD externa, mantendo somente o campo Bitrix24 `RD Station = sim`.
- [x] Extrair integralmente os 418 registros Bitrix24 de 01–07/09/2026 com `UF_CRM_1738950899 = 1`, sem filtros adicionais.
- [x] Recalcular pipelines/BU, não atribuídos e canais usando exclusivamente os próprios campos do Bitrix24: 161 MedSystems, 236 BeautySystems e 21 não atribuídos.
- [x] Recalcular pacing e CPL por BU com o universo Bitrix-only; usar investimento externo somente como numerador financeiro explicitamente rotulado.
- [x] Refazer o Report Lu com 418 leads Bitrix24 RD Station = sim, 397 atribuídos às BUs e 21 não atribuídos.
- [x] Validar, publicar e entregar o Report Lu corrigido, disponível para download em PDF ou PPTX.
- [x] Apurar o total bruto de registros de leads Bitrix24 até 07/09/2026, sem filtros de conteúdo, marca, origem ou deduplicação: 465 IDs únicos no mês.
- [x] Separar os 465 leads brutos de setembro por BU usando exclusivamente o Pipeline de Vendas e mostrar os não atribuídos: 163 MedSystems, 242 BeautySystems, 20 no pipeline 20889 e 40 sem pipeline.
- [x] Apurar os leads do RD Station até 07/09/2026 por BU e explicitar a unidade de contagem da fonte: 189 contatos novos MedSystems e 192 BeautySystems; conversões no período somam 213 e 231 contatos distintos, respectivamente.
- [x] Revisar o Report Lu para usar exclusivamente leads Bitrix24 com `RD Station = sim` em todas as métricas de volume e BU.
- [x] Refinar o layout das quatro lâminas atuais, preservando a identidade visual clean do Report Lu.
- [x] Adicionar duas lâminas finais: síntese dos 15 projetos por status e tabela reconstruída de entregas, marcos e previsões.
- [x] Validar visualmente, publicar e entregar o novo deck de seis lâminas em PDF/PPTX.
- [x] Substituir a lâmina 5 de síntese de status por um plano de ação de mídia com dois eixos: elevar o pacing de BeautySystems e sustentar MedSystems acima de 100%.
- [x] Calcular o ritmo diário necessário por BU e usar somente metas e resultados já validados.
- [x] Apurar no Bitrix24 os mesmos leads `RD Station = sim` por SDR, MQL, SAL, SQL, descartado e fechado, sem inferir etapas ausentes.
- [x] Adicionar uma lâmina auditável de pipeline antes do plano de mídia.
- [x] Validar, publicar e entregar o deck atualizado com o cronograma preservado na lâmina final.
- [x] Separar `Convertidos` de `SQL` na visão dos 418 leads Bitrix24 com `RD Station = sim`, sem dupla contagem.
- [x] Recalcular SQL e Convertidos por BU diretamente pelos status atuais do Bitrix24.
- [x] Atualizar, validar, publicar e entregar a lâmina de pipeline revisada.
- [x] Apurar negócios ganhos reais vinculados aos 418 leads Bitrix24 com `RD Station = sim` por `LEAD_ID` e contato convertido.
- [x] Separar ganhos do período de setembro, ganhos históricos e vínculos sem segurança suficiente, por BU.
- [x] Atualizar a apresentação com 19 negócios ganhos auditáveis no período — 13 MedSystems e 6 BeautySystems —, validar, publicar e entregar o documento revisado.
- [x] Renomear e reposicionar a apresentação como `Report parcial de resultados — setembro`, com corte e caráter parcial explícitos.
- [x] Atualizar a capa com os logos MedSystems, BeautySystems e BBRO em alta legibilidade.
- [x] Refazer a lâmina de funil usando exatamente as etapas oficiais do Bitrix24, separadas por BU e sem substituir nomes do CRM por MQL/SAL/SQL.
- [x] Revisar a redação do plano de mídia para dar clareza ao ritmo de entrega de BeautySystems e MedSystems.
- [x] Validar, publicar e entregar o novo report parcial em PDF/PPTX.
- [x] Obter novamente versões oficiais dos logos MedSystems, BeautySystems e BBRO e reaplicá-las na capa.
- [x] Remover `Histórico Lead Convertidos` de todas as leituras executivas do funil.
- [x] Reconstruir o funil para mostrar etapas atuais dos leads e negócios ganhos de forma coerente, sem narrativa de match com RD Station.
- [x] Simplificar a lâmina de negócios ganhos para apresentar apenas volumes e valores reais por BU.
- [x] Validar, publicar e entregar novamente o report parcial corrigido.
- [x] Remover todos os logos da capa do Report parcial de setembro.
- [x] Reequilibrar a composição da capa sem adicionar novos elementos de marca.
- [x] Validar, publicar e entregar a apresentação com a capa sem logos.
- [x] Simplificar a capa para exibir somente o título `Report executivo`.
- [x] Remover da capa filtros, horários, período, metodologia, subtítulos e textos auxiliares.
- [x] Validar, publicar e entregar o deck com a capa minimalista.
- [x] Adicionar à capa a indicação `Dados parciais até 08/09`.
- [x] Preservar o título `Report executivo` e o layout minimalista.
- [x] Validar, publicar e entregar o documento com a data atualizada.
- [x] Auditar a cobertura de Bitrix24, Windsor e demais fontes até 08/09/2026 no horário de Brasília.
- [x] Recalcular leads `RD Station = sim`, canais, pacing, projeção, investimento e CPL por BU no corte de 08/09.
- [x] Recalcular as etapas oficiais do Bitrix24 por BU e os negócios ganhos até 08/09.
- [x] Redesenhar o slide 5 dividido por MedSystems e BeautySystems, sem valores de negócios ganhos.
- [x] Manter volumes e valores de negócios ganhos exclusivamente no slide 6.
- [x] Atualizar, validar, publicar e entregar a versão final do report em PDF/PPTX.
- [x] Mapear todas as métricas e componentes do dashboard que ainda usam a regra source-first por contato único.
- [x] Alterar o universo de leads do dashboard para registros Bitrix24 com `RD Station = sim`, sem filtros de título, origem, UTM ou match externo.
- [x] Definir BU somente pelos pipelines 15391 MedSystems e 15395 BeautySystems, mantendo os demais em `Não atribuído`.
- [x] Preservar investimento em Google/Meta, programática e negócios ganhos em suas fontes próprias, sem misturar critérios de inclusão.
- [x] Atualizar os textos metodológicos, KPIs, gráficos, tabelas e filtros afetados na interface.
- [x] Adicionar e executar testes Vitest para a nova regra Bitrix-only.
- [x] Validar no navegador os totais de referência de 01–08/09: 173 MedSystems, 244 BeautySystems e 25 não atribuídos.
- [x] Salvar, publicar e entregar o dashboard atualizado.
- [x] Extrair do documento `Definição e identificadores — Leads de Marketing` todos os filtros, inclusões e exclusões definidos para o RD Station.
- [x] Mapear os filtros do documento para os campos e eventos reais persistidos nas contas RD Station MedSystems e BeautySystems.
- [x] Aplicar exatamente os filtros no período de 01–08/09/2026, sem inferir condições não descritas.
- [x] Validar e informar o número de conversões por BU, com a definição da unidade de contagem explicitada: 223 MedSystems e 244 BeautySystems.
- [x] Extrair os contatos únicos elegíveis pelos filtros documentados do RD Station no corte de 01–08/09/2026.
- [x] Exportar nome, e-mail e telefone em planilha Excel separada por MedSystems e BeautySystems, sem contatos duplicados.
- [x] Validar contagens, campos ausentes e integridade do arquivo antes da entrega: 207 MedSystems e 227 BeautySystems.
- [x] Cruzar os 434 contatos únicos filtrados do RD Station com todos os leads Bitrix24 de 01–08/09/2026 por e-mail e/ou telefone normalizados.
- [x] Deduplicar o resultado por contato RD e separar matches por e-mail, telefone, ambos e casos ambíguos.
- [x] Informar quantos contatos chegaram ao Bitrix24 por BU, sem expor PII no resumo: 207 MedSystems e 227 BeautySystems, 100% encontrados.
- [x] Detalhar os 434 contatos conciliados pelas fontes originais registradas no RD Station, por BU.
- [x] Detalhar os IDs de lead correspondentes pelas fontes originais do Bitrix24, por BU de origem no RD.
- [x] Comparar RD Station versus Bitrix24 e destacar divergências de classificação sem duplicar contatos ou leads.
- [x] Auditar o componente atual de campanha, conjunto e criativo e identificar os campos que causam truncamento e baixa legibilidade.
- [x] Redesenhar a tabela com melhor contraste, hierarquia, larguras, quebra controlada, tooltips e leitura responsiva.
- [x] Auditar os campos e endpoints nativos disponíveis para imagens/miniaturas dos anúncios Meta nas contas oficiais.
- [x] Criar galeria visual de criativos Meta com campanha, conjunto, anúncio, status e métricas, além de filtros de campanha e conjunto.
- [x] Adicionar estados de carregamento, imagem indisponível e erro sem inventar criativos.
- [x] Criar/atualizar testes Vitest, validar desktop/mobile, salvar e publicar as melhorias.
- [x] Auditar a estrutura real do deck e confirmar se a capa ativa é `cover.html` ou `cover.xml`.
- [x] Analisar integralmente a capa e os elementos fixos do sistema visual Report Lu antes da edição.
- [x] Otimizar a capa em uma única reescrita completa, preservando estrutura, identidade e consistência do template.
- [x] Registrar o padrão visual e editorial atualizado do Report Lu na memória compartilhada do projeto.
- [x] Validar e apresentar o deck completo com todas as lâminas do outline original.
- [x] Confirmar a cobertura de RD Station, Bitrix24, Google, Meta e Publya até 09/09/2026.
- [x] Sincronizar RD Station e Bitrix24 até 09/09/2026 sem alterar a regra `RD Station = sim` do dashboard.
- [x] Atualizar Google, Meta e Programática com dados verificáveis até 09/09/2026.
- [x] Recalcular o snapshot diário e validar os totais do dashboard por BU e sem BU.
- [x] Testar a interface, salvar e publicar a atualização de 09/09/2026.
- [x] Alinhar o Overview ao mês corrente até o último D-1 disponível, com os mesmos filtros e dados atualizados das abas operacionais.
- [x] Validar o intervalo padrão, os KPIs e a atualização diária do Overview antes de publicar.
- [x] Exibir na aba Negócios os negócios ganhos por campanha, conjunto e criativo somente quando houver vínculo técnico comprovado; manter os demais como Não identificado.
- [x] Validar a nova visão de ganhos por origem contra os totais comerciais e publicar as melhorias.
- [x] Exibir a cobertura de UTM dos negócios ganhos e tratar valores genéricos como Não identificado, sem inferir campanha, conjunto ou criativo: 0 de 28 ganhos possuem campanha, conjunto ou criativo válido no CRM.
- [x] Reproduzir e diagnosticar por que a aba Negócios exibe 01–08/09 apesar do corte atualizado até 09/09/2026.
- [x] Corrigir o cálculo do intervalo padrão para usar o último D-1 disponível na interface e nas consultas.
- [x] Criar teste de regressão para o filtro padrão de mês corrente na aba Negócios.
- [x] Validar no navegador os KPIs com corte em 09/09, salvar e publicar a correção.
- [x] Auditar por que 09/09 ficou zerado na evolução diária da aba Negócios.
- [x] Reprocessar todos os leads Bitrix24 criados em 09/09 com RD Station = sim, sem filtros por origem, UTM ou título.
- [x] Recalcular o snapshot e validar os KPIs e o gráfico diário da aba Negócios para 01–09/09.
- [x] Documentar, salvar e publicar o corte corrigido de 09/09/2026.
- [x] Revalidar diretamente na API o total geral de leads criados no Bitrix24 em 09/09, sem usar o flag RD Station.
- [x] Conferir paginação, fuso e data original do CRM contra os registros persistidos.
- [x] Concluir que não há divergência na carga dos leads técnicos e manter inalterada a metodologia da aba Negócios até nova decisão de escopo.
- [x] Apurar no RD Station os leads de marketing de 09/09/2026 conforme os critérios acordados, por BU: 30 eventos MedSystems e 22 BeautySystems, total de 52; equivalem a 28 e 21 contatos únicos, respectivamente.
- [x] Cruzar os 49 contatos únicos qualificados do RD Station em 09/09/2026 com o Bitrix24 por e-mail e/ou telefone normalizado: 15 encontrados, após 156 consultas diretas sem falhas.
- [x] Retomar a consulta direta ao Bitrix24 por e-mail e telefone dos contatos RD Station qualificados em 09/09/2026.
- [x] Retestar o webhook Bitrix24 e concluir o cruzamento direto após a conectividade ser restabelecida.
