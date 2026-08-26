# Correção do carregamento da aba Negócios

## Diagnóstico

A consulta publicada respondia corretamente, porém demorava aproximadamente 9,5 segundos porque carregava todos os leads Bitrix24 do período e só depois filtrava `UF_CRM_1744808620 = Tráfego Pago` em memória. Com o crescimento da base, a interface permanecia tempo demais no estado “Montando o funil de Tráfego Pago”.

## Correção

O filtro estruturado de Tráfego Pago foi movido para a consulta SQL, reduzindo o número de payloads brutos transferidos e processados. A leitura completa de negócios foi preservada para não alterar vínculos, volumes ou valores. A atualização automática a cada minuto foi removida; o resultado permanece válido por cinco minutos e não recarrega ao voltar o foco da janela.

Em falhas reais, a interface agora apresenta uma mensagem recuperável com o botão “Tentar novamente”, em vez de permanecer indefinidamente no spinner.

## Validação

Na prévia, a consulta completa passou a responder em 991 ms. Os indicadores permaneceram iguais aos da versão anterior no recorte de 01/08/2026 a 25/08/2026: 912 leads, 765 MQLs, 52 SQLs, 29 negócios e R$ 259.000 de valor total.
