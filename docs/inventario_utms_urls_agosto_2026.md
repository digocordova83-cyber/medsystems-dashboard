# Inventário de UTMs e URLs de Campanha

**Período consultado:** 1 a 13 de agosto de 2026.  
**Fonte:** configurações de anúncio disponíveis nas contas conectadas ao Windsor.ai.  
**Escopo:** Medsystems e BeautySystems, em Google Ads e Meta Ads.

> Este inventário reproduz apenas URLs e parâmetros efetivamente retornados pelas plataformas. Valores não retornados permanecem indicados como indisponíveis; nenhuma UTM foi criada ou completada neste documento.

## Como o tracking está configurado

| Plataforma | Campo da plataforma com a URL | Onde as UTMs estão presentes | Campos de tracking não preenchidos na amostra consultada |
|---|---|---|---|
| Google Ads | `ad_final_urls` | Na própria URL final do anúncio | `ad_final_url_suffix`, `ad_tracking_url_template`, `ad_url_custom_parameters` e `campaign_tracking_setting_tracking_url` |
| Meta Ads | `website_destination_url` | Na própria URL de destino do anúncio | `link_url`, `url_tags` e `object_url` |

Em ambas as plataformas, as URLs observadas usam os parâmetros `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `utm_term`.

## Google Ads — Medsystems

O padrão observado é **`utm_source=google`** e **`utm_medium=cpc`**. O nome de campanha é enviado em `utm_campaign`; `utm_content` identifica a peça/variante e `utm_term` registra o criativo de busca.

| Campanha Google Ads | URL de destino observada | UTMs observadas |
|---|---|---|
| `medical-search-institucional` | `https://conteudo.medsystems.com.br/lp-institucional` | `utm_source=google` · `utm_medium=cpc` · `utm_campaign=medical-search-institucional` · `utm_content=00-institucional` · `utm_term=search-criativo-01` a `search-criativo-03` |
| `medical-search-youlaser-prime` | `https://conteudo.medsystems.com.br/cotacao-youlaser-prime-lp` | `utm_source=google` · `utm_medium=cpc` · `utm_campaign=medical-search-youlaser-prime` · `utm_content=00-youlaser-prime` · `utm_term=search-criativo-01` a `search-criativo-02` |

Exemplo completo retornado:

```text
https://conteudo.medsystems.com.br/lp-institucional?utm_source=google&utm_medium=cpc&utm_campaign=medical-search-institucional&utm_content=00-institucional&utm_term=search-criativo-01
```

## Google Ads — BeautySystems

O padrão observado também é **`utm_source=google`** e **`utm_medium=cpc`**.

| Campanha Google Ads | URL de destino observada | UTMs observadas |
|---|---|---|
| `bts-search-vectra` | `https://conteudo.beautysystems.com.br/cotacao-vectra-h2-lp-ads` | `utm_source=google` · `utm_medium=cpc` · `utm_campaign=bts-search-vectra` · `utm_content=vectra` · `utm_term=search-bts-vectra-01` |
| `bts-search-institucional` | `https://conteudo.beautysystems.com.br/cotacao-institucional-lp` | `utm_source=google` · `utm_medium=cpc` · `utm_campaign=bts-search-institucional` · `utm_content=institucional` · `utm_term=search-bts-institucional-01` |
| `bts-search-mpt` | `https://conteudo.beautysystems.com.br/cotacao-ultraformer-mpt-2026q2-lp` | `utm_source=google` · `utm_medium=cpc` · `utm_campaign=bts-search-mpt` · `utm_content=mpt` · `utm_term=search-bts-mpt-01` a `search-bts-mpt-02` |

As campanhas PMax retornadas na amostra não trouxeram URL de anúncio disponível pelo conector; por isso não foram consideradas como URL configurada.

## Meta Ads — Medsystems

As URLs de destino observadas usam **`utm_source=facebook`** e **`utm_medium=cpc`**. A URL inclui a campanha em `utm_campaign`, a audiência/conjunto em `utm_content` e a peça em `utm_term`.

| Campanha informada na URL | URL de destino observada | Exemplo de conteúdo e termo |
|---|---|---|
| `medical-volformer-conversao-lp` | `https://conteudo.medsystems.com.br/volformer-cotacao-lp` | `utm_content=01-medical-advantage-audiencia-quente` · `utm_term=estatico-03-conceitual-volformer` |
| `medical-mpt-lp` | `https://conteudo.medsystems.com.br/cotacao-ultraformer-mpt-2026q2-lp` | `utm_content=advantage-mix-quentes-e-lookalikes` · `utm_term=video-01-mpt-dra-lais-lp` |
| `medical-youlaser-prime-conversao-lp` | `https://conteudo.medsystems.com.br/cotacao-youlaser-prime-lp` | `utm_content=advantage-mix-quentes-e-lookalikes` · `utm_term=estatico-01-youlaser-prime` |
| `medical-volnewmer-conversao-lp` | `https://conteudo.medsystems.com.br/cotacao-volnewmer-2026q2-lp` | `utm_content=01-medical-advantage-audiencia-quente` · `utm_term=estatico-04-volnewmer-lp` |

Exemplo completo retornado:

```text
https://conteudo.medsystems.com.br/volformer-cotacao-lp?utm_source=facebook&utm_medium=cpc&utm_campaign=medical-volformer-conversao-lp&utm_content=01-medical-advantage-audiencia-quente&utm_term=estatico-03-conceitual-volformer
```

## Meta Ads — BeautySystems

O padrão é equivalente: **`utm_source=facebook`**, **`utm_medium=cpc`**, campanha em `utm_campaign`, conjunto/audiência em `utm_content` e anúncio/criativo em `utm_term`.

| Campanha informada na URL | URL de destino observada | Exemplo de conteúdo e termo |
|---|---|---|
| `bts-vectra-conversao-lp` | `https://conteudo.beautysystems.com.br/cotacao-vectra-h2-lp-ads` | `utm_content=01-bts-vectra-advantage-audiencia-quente` · `utm_term=ad00-estatico-01-vectra-bts` |
| `bts-mpt-conversao-lp` | `https://conteudo.beautysystems.com.br/cotacao-ultraformer-mpt-2026q2-lp` | `utm_content=01-bts-mpt-advantage-audiencia-quente` · `utm_term=video-04-prova-dra-priscila-v2-mpt-bts` |
| `bts-aquapure-conversao-lp` | `https://conteudo.beautysystems.com.br/cotacao-aquapure-lp-ads` | `utm_content=01-bts-aquapure-advantage-audiencia-quente` · `utm_term=video-01-aquapure-bts` |
| `bts-ultraformer-iii-conversao-lp` | `https://conteudo.beautysystems.com.br/cotacao-ultraformer-iii-26q3-lp-ads` | `utm_content=01-bts-ultraformer-iii-advantage-audiencia-quente` · `utm_term=estatico-01-ultraformer-iii-bts` |
| `bts-youlaser-conversao-lp` | `https://conteudo.beautysystems.com.br/cotacao-lp-youlaser-ads` | `utm_content=01-bts-youlaser-advantage-audiencia-quente` · `utm_term=video-01-youlaser-bts` |

## Regra de conciliação aplicada ao dashboard

O dashboard passou a comparar os valores recebidos no Bitrix24 com os parâmetros das URLs configuradas nas plataformas. O vínculo é aceito apenas se o valor de `utm_campaign`, `utm_content` ou `utm_term` levar a **uma única campanha da mesma marca**. Quando uma chave aponta para mais de uma campanha, ela permanece fora do ranking atribuído.

| Evidência | Uso no dashboard |
|---|---|
| Valor Bitrix igual a UTM de uma URL de campanha/anúncio e mapeado para uma única campanha | Exibido como **URL configurada** |
| Nome ou ID de campanha igual ao valor recebido | Exibido como **UTM exata** |
| Chave de criativo normalizada, única na mesma marca | Exibido como **Chave criativa** |
| Ausência, colisão ou ambiguidade de identificador | Mantido como **Não identificado**, sem atribuição de receita ou descarte à campanha |

## Arquivos de evidência bruta

Os quatro arquivos JSON de evidência, anexados separadamente, preservam o retorno do Windsor.ai por anúncio e podem ser usados para consultar todas as URLs e variações de UTM disponíveis no período.
