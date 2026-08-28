# Autenticação da API Publya — validação oficial

Fonte oficial: https://docs.publya.com/docs/api/introducao/ e https://docs.publya.com/docs/api/rotas/token/

O endpoint correto é `POST https://api.publya.com/kermit/leap/reports/external/token`. O token temporário expira em 48 horas, é de uso único e, após uma troca bem-sucedida, não pode ser reutilizado. A resposta de sucesso contém `{ "token": "..." }`.

As chamadas seguintes exigem `Authorization: Bearer <token_permanente>` e `User-Data: <base64(clientId:clientEmail)>`. A documentação lista campanhas pela rota `GET /reports/external/campaigns` e recomenda a versão v2 para métricas normalizadas.

O token temporário fornecido foi trocado com sucesso no primeiro teste de integração e, por ser de uso único, passou a retornar HTTP 400 nas tentativas subsequentes. A documentação não apresenta uma rota pública para gerar um novo token temporário; ele é enviado por e-mail após a equipe Publya habilitar o acesso.
