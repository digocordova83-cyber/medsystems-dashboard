# MedSystems — Dashboard Gerencial

Dashboard operacional de **MedSystems + BeautySystems** para leitura auditável de mídia, leads, CRM e negócios. O projeto combina React 19, TypeScript, Vite, Express, tRPC, Drizzle ORM, MySQL/TiDB e integrações com RD Station, Bitrix24, Windsor, Publya e Push.

> **Repositório:** `digocordova83-cyber/medsystems-dashboard`  
> **Classificação:** privado — contém lógica proprietária de integração e operação.  
> **Fonte da migração:** projeto MedSystems no ambiente Manus, com publicação externa preparada sem alterar a produção atual.

## O que este projeto entrega

- Overview executivo de investimento, conversões de plataforma, leads RD, chegada ao Bitrix24, negócios e vendas.
- Abas específicas para Google Ads, Meta Ads, Programática e Negócios.
- Conciliação RD Station → Bitrix24 por e-mail/nome conforme regra documentada, com múltiplos candidatos explícitos.
- Importação canônica de mídia por plataforma + conta + data + campanha.
- Atualização D-1 em horário de Brasília, preservando o último snapshot válido em caso de falha parcial.
- Autenticação local do dashboard e trilha administrativa de acessos.
- Testes unitários e de contrato, checagem TypeScript e build de produção.

## Arquitetura resumida

```text
Browser
  │
  └── React + tRPC client
        │
        └── Express /api/trpc
              ├── RD Station service + OAuth callback
              ├── Bitrix24 CRM service
              ├── Windsor media reconciliation
              ├── Publya / Push service
              ├── Drizzle ORM → MySQL/TiDB
              └── scheduled routes para rotinas D-1
```

A aplicação não deve receber credenciais no frontend. Segredos ficam no gerenciador de secrets da hospedagem e são lidos apenas no servidor.

## Requisitos locais

- Node.js 22
- pnpm 10
- MySQL/TiDB compatível quando a execução exigir banco
- Credenciais de integração somente em ambiente local protegido; nunca em commits

## Instalação e execução

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Para uma execução de produção local:

```bash
pnpm install --frozen-lockfile
pnpm build
NODE_ENV=production pnpm start
```

A lista de variáveis está em [`docs/environment-contract.md`](docs/environment-contract.md). O arquivo não contém valores de credenciais.

## Validação obrigatória

```bash
pnpm test:ci
pnpm check
pnpm build
pnpm verify:repo
```

`pnpm test` continua disponível para a suíte completa no ambiente autorizado, incluindo verificações de integração. O CI público usa `pnpm test:ci`, que exclui testes que chamam APIs reais ou dependem de credenciais locais.

## Banco e migrações

O schema está em [`drizzle/schema.ts`](drizzle/schema.ts) e os artefatos versionados ficam em [`drizzle/`](drizzle/). Em staging, revisar o SQL e aplicar as migrações com a conexão do ambiente:

```bash
pnpm exec drizzle-kit migrate
```

`pnpm db:push` existe para o fluxo local controlado; não executar em produção sem revisão do SQL, backup e janela aprovada.

## Rotina D-1

As rotas agendadas atuais são:

- `POST /api/scheduled/paid-media-reconciliation`
- `POST /api/scheduled/publya-sync`

No ambiente Manus, a autenticação de scheduler é feita pela infraestrutura gerenciada. Em uma hospedagem externa, as rotas devem ser protegidas por segredo próprio, allowlist de rede ou mecanismo equivalente antes do primeiro ciclo automático. O runbook completo está em [`docs/github-migration.md`](docs/github-migration.md).

## Regras de dados

- Datas de negócio usam `America/Sao_Paulo`.
- Não somar snapshots históricos.
- Não misturar campanhas, conjuntos e anúncios como se fossem o mesmo nível.
- Não apresentar linhas técnicas Bitrix24 como pessoas únicas.
- Não inferir BU fora dos pipelines confirmados.
- Não calcular ROAS ou receita por canal sem vínculo auditável.
- Não expor PII em logs, relatórios públicos ou commits.

## Fluxo de contribuição

1. Criar branch a partir de `main`.
2. Fazer a alteração com teste ou contrato atualizado.
3. Executar `pnpm test:ci`, `pnpm check`, `pnpm build` e `pnpm verify:repo`.
4. Abrir Pull Request descrevendo dados afetados, período, fonte e limitações.
5. Fazer merge somente com CI verde e revisão da alteração.
6. Criar tag de release após a validação em staging.

## Migração externa

O push para o GitHub **não migra banco, storage, segredos, scheduler, DNS ou domínio**. Esses itens são tratados em etapas separadas no [runbook de migração](docs/github-migration.md), com staging, cópia reconciliada, sete ciclos D-1 em paralelo, cutover autorizado e rollback preservado.

## Documentos essenciais

- [`docs/github-migration.md`](docs/github-migration.md) — plano técnico, gates, cutover e rollback.
- [`docs/environment-contract.md`](docs/environment-contract.md) — contrato de variáveis sem valores sensíveis.
- [`docs/operations-runbook.md`](docs/operations-runbook.md) — operação diária, D-1, incidentes e validação.
- [`docs/security-and-secrets.md`](docs/security-and-secrets.md) — higiene do repositório e gestão de segredos.
- [`docs/dashboard-update-2026-09-21.md`](docs/dashboard-update-2026-09-21.md) — última linha de base auditável do dashboard.
- [`todo.md`](todo.md) — histórico operacional do projeto.

## Licença

Código proprietário da BBRO/Medsystems. O repositório é privado e não autoriza redistribuição, publicação ou reutilização sem autorização dos responsáveis.

## Status da publicação

A preparação para GitHub é versionada separadamente da produção. Nenhuma troca de DNS, encerramento do ambiente Manus ou migração definitiva de escrita é realizada por este repositório.
