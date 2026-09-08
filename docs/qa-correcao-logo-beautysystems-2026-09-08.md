# QA — correção do logo BeautySystems

O URL externo da capa retornou HTTP 403, o que explicava a área vazia no PDF. O logo foi recuperado do PDF de agosto já validado e inspecionado visualmente: trata-se do ativo BeautySystems em azul-turquesa, com dimensões de 137 × 60 px. A correção reutilizará esse arquivo estável, preservando a posição, dimensões e composição originais da capa do Report Lu.

A composição com alfa invertido foi validada sobre fundo claro e preserva a cor azul-turquesa, ao contrário da primeira máscara, que perdeu a fidelidade visual. A capa usa o ativo corrigido em sobreposição exatamente nas mesmas coordenadas do logo original: x=1028, y=342, largura=150 e altura=68.

Na primeira exportação, o JPEG extraído ainda preservou seu fundo preto. A versão final remove esse fundo por limiar de pixels escuros, preservando o desenho azul-turquesa e mantendo transparência no painel claro da capa.

O arquivo transparente final foi publicado como ativo estável do projeto e referenciado na capa sem mudança de coordenadas ou dimensão.

O renderer de slides requer um caminho absoluto ou URL HTTP(S), portanto a capa mantém o caminho absoluto do ativo transparente no ambiente de slides. O caminho relativo de armazenamento não é usado porque gerou um quadro em branco na exportação.
