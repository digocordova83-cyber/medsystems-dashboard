# Runbook operacional — MedSystems Dashboard

## Rotina D-1

A rotina deve processar o dia útil anterior em `America/Sao_Paulo`. A ordem operacional recomendada é:

1. Atualizar RD Station nas contas MedSystems e BeautySystems.
2. Sincronizar Leads, Negócios e Contatos referenciados do Bitrix24.
3. Consultar Google Ads e Meta Ads nas quatro contas oficiais, por campanha e dia.
4. Importar a mídia pela chave canônica `plataforma + conta + data + campaign_id`.
5. Atualizar criativos Meta quando a carga ad-level estiver disponível.
6. Sincronizar Publya e Push sem sobrepor snapshots ou inventar custo.
7. Persistir o snapshot diário RD→Bitrix.
8. Executar auditoria agregada sem PII.
9. Validar máxima de data, investimento, contagens, duplicidades e erros por fonte.
10. Registrar documentação e release/checkpoint.

## Critérios de sucesso

- A máxima de data de cada fonte coincide com o corte esperado ou a defasagem está explicada.
- Nenhuma chave canônica provisória permanece quando há `campaign_id` técnico.
- Snapshots não são somados novamente.
- Leads, contatos, IDs técnicos e linhas de múltiplos permanecem identificados separadamente.
- Falha de uma fonte não sobrescreve o último snapshot válido com zeros.
- Logs não contêm PII nem payloads brutos.

## Falha parcial

Se RD, Bitrix, Windsor, Publya ou Push falhar:

- marcar a fonte como indisponível;
- preservar o último resultado válido;
- registrar início, fim, fonte, período, erro e impacto;
- não preencher valores por estimativa;
- não executar novamente em loop sem limite;
- reprocessar somente após identificar a causa e preservar idempotência.

## Validação antes de release

```bash
pnpm verify:repo
pnpm test:ci
pnpm check
pnpm build
```

Para uma atualização de dados autorizada no ambiente com credenciais:

```bash
pnpm exec tsx scripts/update-dashboard-d1-YYYY-MM-DD.mjs
pnpm exec tsx scripts/audit-dashboard-d1-YYYY-MM-DD.mjs
```

Usar os scripts datados existentes como registro histórico; criar um novo script datado somente quando a execução exigir uma nova fotografia auditável.

## Incidentes

| Sintoma                  | Primeira ação                                                   | Não fazer                                                           |
| ------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| Overview em carregamento | Verificar `auth.me`, API tRPC, latência e logs do servidor      | Não recarregar snapshots ou alterar métricas para “corrigir” a tela |
| Investimento duplicado   | Conferir chave canônica, `recordLevel` e `campaign_id`          | Não apagar linhas brutas sem auditoria                              |
| Leads divergentes        | Separar contatos únicos, IDs Bitrix e linhas técnicas múltiplas | Não apresentar linhas técnicas como pessoas                         |
| Fonte sem dados          | Confirmar janela, credencial e última data retornada            | Não converter ausência em zero sem evidência                        |
| D-1 duplicado            | Conferir business date e snapshot persistido                    | Não somar uma segunda fotografia                                    |
| Credencial exposta       | Revogar/rotacionar imediatamente e registrar incidente          | Não copiar o valor para issue, chat ou log                          |

## Evidências obrigatórias

Toda atualização deve deixar: data/hora BRT, período, fontes, volumes antes/depois, valores de mídia, máxima de data, regra de conciliação, limitações, testes, build e identificação do release. Exportações com PII ficam fora do GitHub e devem seguir autorização separada.
