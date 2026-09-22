# Segurança e segredos

## Classificação

O repositório contém código proprietário, regras de atribuição, identificadores de integração e documentação operacional. Ele deve permanecer **privado**. Dados pessoais, tokens, senhas, hashes, exports de Excel/CSV, payloads brutos e backups pertencem a canais protegidos e não ao Git.

## Nunca commitar

- `.env` e qualquer variante de ambiente.
- `DATABASE_URL`, JWT, OAuth client secret, webhook Bitrix ou token Publya.
- E-mail, telefone, nome, CPF ou payload bruto de leads/contatos.
- Planilhas, CSVs, PDFs de exportação ou dumps de banco.
- Screenshots com dados reais.
- Logs de produção.
- Credenciais de GitHub ou artefatos de sessão.

## Onde guardar

- GitHub Actions: secrets do repositório ou do environment, nunca texto no YAML.
- Hospedagem: secret manager por ambiente.
- Local: arquivo de ambiente fora do repositório, com permissões restritas.
- Backups: storage privado com criptografia e retenção definida.

## CI seguro

O workflow usa apenas valores sintéticos para validar código. Testes que fazem chamadas reais ao RD Station, Bitrix24 ou Publya ficam fora de `pnpm test:ci` e só devem ser executados por operador autorizado, no ambiente com credenciais.

## Resposta a exposição

1. Revogar ou rotacionar a credencial no provedor.
2. Identificar escopo, período e possíveis consumidores.
3. Preservar evidência sem redistribuir o segredo.
4. Remover o artefato do branch e avaliar limpeza de histórico.
5. Reexecutar `pnpm verify:repo`.
6. Registrar a ocorrência sem incluir o valor exposto.

## Verificação local

```bash
pnpm verify:repo
```

O verificador bloqueia nomes de arquivos de secrets/exports e padrões comuns de credenciais ou chaves privadas no conteúdo versionado. Ele não substitui revisão humana nem rotação de credenciais.
