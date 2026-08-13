# Referência OAuth2 do RD Station Marketing

O fluxo de autorização utiliza `https://api.rd.services/auth/dialog` com os parâmetros `client_id`, `redirect_uri` e `state`. Depois da autorização, o RD Station redireciona o usuário ao callback com o `code` e o `state`.

A troca do código é feita por `POST https://api.rd.services/auth/token?token_by=code`, com `client_id`, `client_secret` e `code` no corpo. O código é válido por uma hora. A resposta retorna `access_token`, `refresh_token` e `expires_in`; a documentação informa expiração do access token em 86.400 segundos e refresh token sem expiração informada.

Fontes oficiais:

- https://developers.rdstation.com/reference/gerar-code
- https://developers.rdstation.com/reference/obter-tokens-acesso

## Coleta de contatos

A API lista contatos associados a uma segmentação pelo endpoint `GET https://api.rd.services/platform/segmentations/{id}/contacts`. Cada contato retorna, entre outros campos, `uuid`, `name`, `email`, `last_conversion_date` e `created_at`. A coleta será isolada por conta e aceitará a segmentação informada para cada ambiente do RD Station.

As listagens aceitam `page` e `page_size`; o tamanho máximo de página documentado é 125 e os cabeçalhos de resposta incluem `pagination-total-rows`, `pagination-page-size` e `pagination-page`.

Fontes oficiais:

- https://developers.rdstation.com/reference/get_platform-segmentations-id-contacts-1
- https://developers.rdstation.com/reference/mais-informa%C3%A7%C3%B5es
