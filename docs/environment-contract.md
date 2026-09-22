# Contrato de ambiente — MedSystems

**Objetivo:** registrar quais variáveis a aplicação pode usar na execução local, CI, staging e produção sem armazenar valores de credenciais no Git.

## Princípios

- Valores reais devem ser inseridos somente no secret manager da hospedagem ou no ambiente local protegido.
- `.env`, `.env.*`, chaves, tokens, cookies e URLs de webhook com segredo nunca devem ser commitados.
- Variáveis não utilizadas por um ambiente devem permanecer ausentes, e não preenchidas com credenciais fictícias.
- A lista abaixo é um inventário de nomes observados no código; a obrigatoriedade depende do módulo executado.

## Núcleo da aplicação

| Variável                      | Uso                                               | Classificação         |
| ----------------------------- | ------------------------------------------------- | --------------------- |
| `NODE_ENV`                    | Modo `development`, `test` ou `production`        | Configuração          |
| `PORT`                        | Porta HTTP do processo                            | Configuração          |
| `DATABASE_URL`                | Conexão MySQL/TiDB usada pelo Drizzle             | **Secreta**           |
| `JWT_SECRET`                  | Assinatura de sessão/cookies                      | **Secreta**           |
| `VITE_APP_ID`                 | Identificador do app Manus/OAuth quando aplicável | Sensível              |
| `OAUTH_SERVER_URL`            | Origem do OAuth gerenciado                        | Configuração sensível |
| `OWNER_OPEN_ID`               | Identidade do proprietário no runtime Manus       | Sensível              |
| `BUILT_IN_FORGE_API_URL`      | Endpoint de APIs internas Manus                   | Configuração sensível |
| `BUILT_IN_FORGE_API_KEY`      | Chave de APIs internas Manus                      | **Secreta**           |
| `VITE_FRONTEND_FORGE_API_URL` | Endpoint público permitido para o frontend        | Configuração          |
| `VITE_FRONTEND_FORGE_API_KEY` | Chave pública limitada, se aplicável              | Sensível              |
| `VITE_OAUTH_PORTAL_URL`       | Portal de login OAuth no frontend                 | Configuração          |
| `VITE_APP_TITLE`              | Título visual do aplicativo                       | Configuração          |

## Integrações

| Variável                                | Integração                | Observação                                                            |
| --------------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| `BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL`  | Bitrix24                  | URL deve ser tratada como segredo porque pode conter token no caminho |
| `PUBLYA_API_BASE_URL`                   | Publya                    | Configuração de endpoint                                              |
| `PUBLYA_CLIENT_ID`                      | Publya                    | Identificador de cliente                                              |
| `PUBLYA_EMAIL`                          | Publya                    | Identidade de integração                                              |
| `RDSTATION_MEDSYSTEMS_CLIENT_ID`        | RD Station MedSystems     | Identificador OAuth                                                   |
| `RDSTATION_MEDSYSTEMS_CLIENT_SECRET`    | RD Station MedSystems     | **Secreta**                                                           |
| `RDSTATION_BEAUTYSYSTEMS_CLIENT_ID`     | RD Station BeautySystems  | Identificador OAuth                                                   |
| `RDSTATION_BEAUTYSYSTEMS_CLIENT_SECRET` | RD Station BeautySystems  | **Secreta**                                                           |
| `RDSTATION_CALLBACK_BASE_URL`           | Callback OAuth RD Station | Deve apontar para o domínio correto do ambiente                       |

## Variáveis de scripts e consultas

`RD_CONTACT_ACCOUNTS`, `RD_CONTACT_PAGES_PER_RUN`, `RD_JULY_ACCOUNT`, `RD_JULY_BATCH_SIZE`, `RD_JULY_VIEW`, `RESET_CURSOR`, `SEGMENT_QUERY`, `TARGET_FIELD`, `LOSS_CANDIDATES` e `MAX_PAGES` são parâmetros de scripts específicos. Devem ser definidos somente durante a execução autorizada do script e documentados no log operacional sem registrar o valor de credenciais.

## CI

O CI usa valores sintéticos e não acessa APIs reais. Os testes externos são separados da suíte determinística por `pnpm test:ci`. Credenciais reais não são necessárias para validar instalação, TypeScript, build e regras puras.

## Checklist de provisionamento

- [ ] Criar secret manager por ambiente.
- [ ] Inserir `DATABASE_URL` com usuário exclusivo e TLS.
- [ ] Inserir `JWT_SECRET` aleatório, longo e exclusivo por ambiente.
- [ ] Inserir credenciais RD Station, Bitrix24, Publya e demais fontes somente no ambiente que realmente as utilizará.
- [ ] Configurar callback OAuth e domínios de staging/produção separadamente.
- [ ] Testar rotação e revogação de cada credencial.
- [ ] Confirmar que nenhum valor aparece em logs, screenshots, artefatos de build ou GitHub Actions.
