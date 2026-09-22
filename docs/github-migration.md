# Runbook de migração para GitHub e hospedagem externa

**Projeto:** MedSystems — Dashboard Gerencial  
**Data de preparação:** 22/09/2026  
**Repositório GitHub:** `digocordova83-cyber/medsystems-dashboard`  
**Visibilidade:** privado  
**Referência de método:** migração documentada do projeto MG Motors, adaptada para as integrações e regras de dados do MedSystems.

## 1. Limite desta etapa

Esta etapa publica o código-fonte e a documentação no GitHub. Ela **não** migra banco, storage, tokens, contas locais, scheduler, DNS ou domínio. A produção atual permanece intacta até que os gates de migração sejam aprovados.

A publicação do GitHub é um marco de versionamento e colaboração; o cutover é um projeto separado de infraestrutura.

## 2. Linha de base conhecida

A linha de base do dashboard antes da publicação inclui:

- React 19, TypeScript, Vite, Express, tRPC e Drizzle ORM.
- MySQL/TiDB como banco da aplicação.
- RD Station nas duas BUs, Bitrix24, Windsor para Google/Meta, Publya e Push.
- Rotina D-1 no fuso `America/Sao_Paulo`.
- Funil RD Station → Bitrix24 com duplicidades técnicas explícitas.
- Exclusão analítica vigente de Aeskins e Advance Vision, preservando dados brutos.
- Última atualização auditável registrada em [`dashboard-update-2026-09-21.md`](dashboard-update-2026-09-21.md).
- Estado de código validado com testes, TypeScript e build antes da preparação do repositório.

Nenhum PII, exportação de Excel, token temporário ou token permanente deve ser incluído nesta linha de base do GitHub.

## 3. Estratégia de branches e releases

- `main`: código integrado e apto a deploy após CI verde.
- `feature/*`: alterações de produto ou migração.
- `migration/*`: alterações exclusivamente de infraestrutura/cutover.
- Tags `vYYYY.MM.DD` para releases que entram em staging ou produção.
- Toda alteração deve registrar fonte, período, unidade, limitação e teste correspondente.

O repositório deve permanecer privado até revisão de propriedade intelectual e aprovação explícita de eventual publicação ampla.

## 4. Gates de migração

| Gate              | Atividade                                                             | Evidência de aprovação                                   |
| ----------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| G0 — Decisão      | Confirmar hospedagem, responsável, banco, storage, DNS, SSL e alertas | Matriz de responsabilidades aprovada                     |
| G1 — Código       | Clone limpo e CI verde no GitHub                                      | `pnpm test:ci`, `pnpm check`, `pnpm build`               |
| G2 — Staging      | Criar aplicação, MySQL, storage privado, secrets e logs               | `/health` ou check equivalente, login e logs funcionando |
| G3 — Banco        | Exportar e restaurar schema/dados com backup                          | Contagens, datas, somas, IDs e hashes reconciliados      |
| G4 — Integrações  | Configurar RD, Bitrix, Windsor, Publya e callbacks OAuth              | Testes isolados por fonte, sem PII em logs               |
| G5 — D-1 paralelo | Executar sete ciclos fechados nos dois ambientes                      | Mesmo corte, mesmas chaves canônicas e zero duplicação   |
| G6 — Delta final  | Congelar escrita por janela curta e aplicar delta                     | Divergência zero nas tabelas críticas                    |
| G7 — Cutover      | Trocar DNS somente após autorização explícita                         | Novo ambiente saudável e rollback pronto                 |
| G8 — Observação   | Monitorar no mínimo 72 horas e três ciclos D-1                        | Operação estável, alertas e confirmação diária           |

## 5. Preparação do ambiente externo

### Aplicação

```bash
git clone https://github.com/digocordova83-cyber/medsystems-dashboard.git
cd medsystems-dashboard
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm test:ci
pnpm build
NODE_ENV=production pnpm start
```

### Banco

1. Criar um MySQL 8 compatível, com TLS, usuário exclusivo e backup automático.
2. Aplicar as migrações versionadas após revisar os SQLs em `drizzle/`.
3. Nunca executar `db:push` diretamente em produção sem backup e aprovação.
4. Validar contagem, menor data, maior data, somatórios, chaves e registros de auditoria.
5. Guardar o backup inicial fora do repositório, com retenção mínima definida pela BBRO.

### Storage

O ambiente externo deve usar bucket privado S3 compatível, versionamento, URLs assinadas e política de ciclo de vida. Não usar disco local efêmero para arquivos persistentes.

### Scheduler

As rotas atuais são:

- `POST /api/scheduled/paid-media-reconciliation`
- `POST /api/scheduled/publya-sync`

O runtime atual autentica jobs pela infraestrutura Manus. Antes de mover para fora, implementar ou configurar autenticação externa equivalente, preferencialmente segredo rotacionável + allowlist de rede + identificador de execução. O job deve calcular D-1 em `America/Sao_Paulo` e impedir dupla execução para o mesmo business date.

## 6. Matriz de aceite funcional

- Login válido, inválido, sessão expirada e logout.
- Perfis administrador/cliente e log de acesso.
- Overview e filtros de período, BU, canal e status.
- Google Ads e Meta Ads no nível campanha/dia.
- Criativos Meta e cobertura granular.
- Programática e Push com limites de atribuição visíveis.
- Negócios Bitrix24, MQL, SQL, ganhos e descartes.
- Conciliação RD Station → Bitrix24, incluindo múltiplos candidatos.
- Exclusão analítica de Aeskins/Advance sem apagar dados brutos.
- Execução D-1, idempotência e falha parcial por fonte.
- Migrações/restart do banco e recuperação de backup.
- Logs sem e-mail, telefone, nome pessoal, token ou payload bruto.

## 7. Cutover e rollback

O cutover só pode ocorrer com autorização explícita da BBRO. Durante a observação, manter a produção atual ativa e disponível. Se houver divergência de dados, erro de autenticação, perda de arquivos, atraso recorrente ou falha crítica:

1. Pausar o scheduler externo para impedir gravação dupla.
2. Reverter DNS ou proxy para o ambiente anterior.
3. Preservar o banco novo e os logs para diagnóstico.
4. Registrar o business date e o último snapshot válido.
5. Corrigir, gerar novo delta e repetir os gates afetados.
6. Só retomar o cutover após nova validação em staging.

## 8. Responsabilidades ainda necessárias

| Tema        | Decisão pendente                                     |
| ----------- | ---------------------------------------------------- |
| Hospedagem  | VM/Docker, PaaS ou outro modelo                      |
| Banco       | MySQL gerenciado, TLS, backups e responsável         |
| Storage     | Bucket S3, versionamento e retenção                  |
| Rede        | Firewall, allowlist e saída HTTPS                    |
| Domínio     | Staging, DNS, SSL e janela de mudança                |
| Integrações | Titularidade/rotação de RD, Bitrix, Windsor e Publya |
| Alertas     | Canal e pessoa de plantão                            |
| Identidade  | Login local ou SSO corporativo                       |

## 9. Critério de encerramento

A migração só é considerada concluída quando o ambiente externo estiver em produção, com sete ciclos D-1 equivalentes, backup restaurável, alertas ativos, documentação atualizada, rollback testado e autorização de cutover registrada. Criar o repositório GitHub, sozinho, não satisfaz esse critério.

## 10. Relação com o padrão MG

O método reaproveita do projeto MG: CI no GitHub, inventário de infraestrutura, migração em paralelo, matriz de aceite, backup, observação pós-cutover e rollback. O MedSystems acrescenta gates específicos para múltiplas BUs, conciliação RD→Bitrix, linhas técnicas versus pessoas, quatro contas Windsor, Publya/Push e proteção de PII.
