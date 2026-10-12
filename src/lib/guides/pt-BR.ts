import type { ToolGuide, GuideLabels } from '../guide-schema.ts';
import type { ToolId } from '../catalog.ts';

export const guideLabelsPtBR = {
  "usage": "Como usar",
  "example": "Exemplo e interpretação",
  "exampleInput": "Entrada de exemplo",
  "exampleResult": "O que o resultado significa",
  "limitations": "Entradas aceitas e limites",
  "languages": "Idioma da página",
  "allTools": "Todas as ferramentas",
  "useTool": "Usar a ferramenta nesta página",
  "javascript": "Você pode ler o guia e os exemplos sem JavaScript. Ative o JavaScript para operar a ferramenta.",
  "availability": "Este guia está disponível com a ferramenta ativada ou desativada. O espaço de trabalho interativo respeita as preferências salvas neste navegador.",
  "disabledTitle": "Esta ferramenta está desativada",
  "disabled": "Esta ferramenta está desativada neste navegador. Ative-a em Configurações para usá-la. Abrir o guia não altera suas preferências.",
  "privacy": "As entradas são processadas na memória do navegador. Não são enviadas a nenhum destino, armazenadas nem incluídas na URL da página. Apenas as preferências são salvas."
} satisfies GuideLabels;

export const toolGuidesPtBR = {
  "html-entities": {
    "introduction": "Codifique texto com segurança como referências de caracteres HTML e decodifique um conjunto documentado de referências nomeadas ou referências numéricas válidas sem interpretar a marcação.",
    "steps": [
      "Selecione a direção e o escape mínimo ou completo e insira o texto.",
      "Examine e copie o resultado. A decodificação ocorre em uma única passagem."
    ],
    "exampleInput": "<p title=\"Hello\">A & B 👋</p>",
    "exampleResult": "A codificação mínima gera &lt;p title=&quot;Hello&quot;&gt;A &amp; B 👋&lt;/p&gt;. O modo completo converte caracteres não ASCII em referências numéricas.",
    "limitations": [
      "Máximo de 64 KiB de entrada. A decodificação de referências nomeadas aceita apenas amp/lt/gt/quot/apos/nbsp/copy/reg/trade/euro/hellip/mdash/ndash/times/divide. Referências inválidas e desconhecidas permanecem literais. A marcação nunca é executada."
    ]
  },
  "url-encode": {
    "introduction": "Converta strings com codificação percentual de componente, formulário ou caminho com barras preservadas; nenhuma URL é acessada.",
    "steps": [
      "Escolha a direção da transformação e o modo de codificação e insira uma string.",
      "Examine e copie o resultado."
    ],
    "exampleInput": "A B/日+?",
    "exampleResult": "O modo de componente codifica A B/日+? como A%20B%2F%E6%97%A5%2B%3F; o modo de caminho mantém a barra.",
    "limitations": [
      "Máximo de 64 KiB de entrada. Apenas o modo de formulário interpreta + como espaço ao decodificar. Escapes incorretos e UTF-8 malformado geram erros. Esta ferramenta não analisa nem acessa URLs."
    ]
  },
  "dummy-text": {
    "introduction": "Gere texto de preenchimento reproduzível a partir de frases sintéticas fixas em seis estilos de idioma.",
    "steps": [
      "Escolha o idioma, parágrafos/frases/caracteres, a quantidade e a semente.",
      "Copie ou baixe a saída."
    ],
    "exampleInput": "language=ja; unit=paragraphs; count=3; seed=42",
    "exampleResult": "Japonês / 3 parágrafos / semente 42 sempre produz os mesmos três parágrafos.",
    "limitations": [
      "Máximo de 30 parágrafos, 120 frases ou 10.000 valores escalares Unicode; saída máxima de 64 KiB. As frases são sintéticas, não dados pessoais reais."
    ]
  },
  "css-specificity": {
    "introduction": "Compare a especificidade (a,b,c) de seletores CSS, com a contribuição de cada token.",
    "steps": [
      "Insira um ou mais seletores separados por vírgulas.",
      "Revise as pontuações dos componentes e copie o relatório."
    ],
    "exampleInput": "main#app .card:hover::before, p:where(#preview) > a",
    "exampleResult": "O primeiro seletor tem pontuação (1,2,2) e o segundo (0,0,2). :where contribui com zero.",
    "limitations": [
      "Máximo de 4.096 caracteres, 32 seletores e 8 níveis de aninhamento. Aceita um subconjunto estrito de Selectors 4; & aninhados e pseudofunções incompatíveis geram erros, sem suposições."
    ]
  },
  "fluid-type": {
    "introduction": "Gere um clamp de CSS com interpolação linear a partir de dois pares de largura da janela e tamanho de fonte.",
    "steps": [
      "Insira os limites inferior e superior do tamanho de fonte e da largura da janela, além da base de px por rem.",
      "Mova o controle deslizante da prévia e copie o CSS gerado."
    ],
    "exampleInput": "minSize=16px; maxSize=24px; minViewport=320px; maxViewport=1280px; rootSize=16px",
    "exampleResult": "O exemplo produz font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem);",
    "limitations": [
      "Tamanhos de fonte de 0,5–256 px, larguras de 240–10.000 px e base de 8–32 px. As larguras de janela devem estar em ordem crescente. Os coeficientes CSS são arredondados a seis casas decimais; o valor real de rem depende do tamanho da fonte raiz do navegador."
    ]
  },
  "cubic-bezier": {
    "introduction": "Ajuste uma função de temporização CSS com uma curva amostrada e uma prévia do movimento.",
    "steps": [
      "Edite os controles ou cole a entrada. Todo o processamento ocorre neste navegador.",
      "Revise o resultado e copie ou baixe se precisar."
    ],
    "exampleInput": "x1=.25, y1=.1, x2=.25, y2=1; duration=600 ms",
    "exampleResult": "cubic-bezier(0.25, 0.1, 0.25, 1)",
    "limitations": [
      "x1/x2 devem estar entre 0–1; y1/y2, entre −5–5; duração de 50–20.000 ms. A curva é amostrada e a prévia respeita a preferência por movimento reduzido."
    ]
  },
  "css-gradient": {
    "introduction": "Crie gradientes lineares e radiais com pontos de cor editáveis.",
    "steps": [
      "Edite os controles ou cole a entrada. Todo o processamento ocorre neste navegador.",
      "Revise o resultado e copie ou baixe se precisar."
    ],
    "exampleInput": "linear 90deg; #3366FF 0%, #FF8C00CC 100%",
    "exampleResult": "linear-gradient(90deg, #3366FF 0%, #FF8C00CC 100%)",
    "limitations": [
      "De 2 a 8 pontos de cor com HEX de seis ou oito dígitos e posições de 0–100%. A interpolação do navegador segue o CSS; sem acesso à rede."
    ]
  },
  "svg-placeholder": {
    "introduction": "Crie uma imagem SVG ou PNG com um rótulo de texto para baixar localmente.",
    "steps": [
      "Edite os controles ou cole a entrada. Todo o processamento ocorre neste navegador.",
      "Revise o resultado e copie ou baixe se precisar."
    ],
    "exampleInput": "640×360, #2D5B8A, label='640 × 360'",
    "exampleResult": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...>…</svg> (exportação SVG e PNG)",
    "limitations": [
      "Dimensões de 1–4096 px (máx. 4 MP); rótulo de até 160 bytes UTF-8. O SVG é escapado e não contém scripts nem URLs."
    ]
  },
  "path-batch": {
    "introduction": "Visualize alterações de prefixo, maiúsculas, numeração e separadores sem modificar arquivos.",
    "steps": [
      "Edite os controles ou cole a entrada. Todo o processamento ocorre neste navegador.",
      "Revise o resultado e copie ou baixe se precisar."
    ],
    "exampleInput": "src/Report.txt\nsrc/report.txt; suffix=-new",
    "exampleResult": "src/Report-new.txt / src/report-new.txt; possível colisão ao ignorar maiúsculas e minúsculas",
    "limitations": [
      "Até 500 linhas / 64 KiB; os arquivos nunca são renomeados. A detecção de colisões ignora maiúsculas e minúsculas e é aproximada em sistemas diferentes do Windows."
    ]
  },
  "color-palette": {
    "introduction": "Gere amostras de cores análogas, complementares ou triádicas com base em HSL.",
    "steps": [
      "Edite os controles ou cole a entrada. Todo o processamento ocorre neste navegador.",
      "Revise o resultado e copie ou baixe se precisar."
    ],
    "exampleInput": "base=#3366FF, count=5, analogous",
    "exampleResult": "Cinco matizes HSL determinísticos e variáveis CSS que você pode copiar",
    "limitations": [
      "De 2 a 8 cores sRGB a partir de HEX, com alfa opcional. A harmonia HSL não garante o contraste exigido pela WCAG."
    ]
  },
  "chmod": {
    "introduction": "Examine os bits de permissão de arquivos Linux antes de alterar um modo. Converta entre valores octais e caixas rwx, visualize alterações simbólicas com destinatários explícitos e compare permissões de criação sob umask.",
    "steps": [
      "Insira três ou quatro dígitos octais ou selecione um exemplo e ajuste proprietário, grupo, outros e bits especiais. Cálculos pequenos são atualizados imediatamente.",
      "Visualize uma expressão com classes explícitas, como u+x,g-w,o=. Escolha o comportamento de diretório quando necessário. Clique em Usar prévia para substituir o modo selecionado.",
      "Insira umask separadamente para ver exemplos comuns de criação de arquivos e diretórios. Copie o comando GNU/Linux quando precisar; substitua ./path antes de usar."
    ],
    "exampleInput": "mode: 0644\nsymbolic: u+x,g-w,o=\numask: 022",
    "exampleResult": "0644 equivale a rw-r--r--. A prévia simbólica é 0740 (rwxr-----). Com modos de criação solicitados de 0666/0777 e sem ACL padrão, umask 022 produz 0644 para arquivos e 0755 para diretórios.",
    "limitations": [
      "Esta é uma calculadora de 12 bits, não um simulador de acesso efetivo ou de sistema de arquivos. Comandos não são executados; ACLs, propriedade, permissões de diretórios pais e opções de montagem estão fora do escopo.",
      "A entrada simbólica exige u/g/o/a explícitos, um operador +, - ou = por cláusula e rwxst. X, cópia de permissões e espaços internos não são aceitos. Máximo de 256 bytes UTF-8 e 32 cláusulas; as entradas octais e umask têm no máximo 16 caracteres brutos.",
      "Em diretórios, = preserva setuid/setgid não mencionados; u-s/g-s explícitos os limpam. O operando octal GNU de cinco dígitos copiado controla todos os bits especiais. Os exemplos de umask são separados de chmod."
    ]
  },
  "base64": {
    "introduction": "Codifique texto UTF-8 em Base64 ou decodifique Base64 de volta para UTF-8. A conversão acontece inteiramente no seu navegador.",
    "steps": [
      "Escolha codificar ou decodificar e o alfabeto padrão ou seguro para URL e insira o texto.",
      "Entradas curtas são atualizadas imediatamente. Textos maiores são processados em um Worker após uma breve pausa; a aplicação manual também está disponível.",
      "Copie ou baixe o resultado, ou troque-o com a entrada para fazer a conversão inversa."
    ],
    "exampleInput": "こんにちは 👋",
    "exampleResult": "A codificação padrão produz 44GT44KT44Gr44Gh44GvIPCfkYs= e converte 20 bytes UTF-8 em 28 caracteres Base64.",
    "limitations": [
      "A entrada é limitada a 256 KiB. A saída padrão usa preenchimento com =; a saída segura para URL substitui + e / e omite o preenchimento.",
      "A decodificação aceita texto canônico com ou sem preenchimento, mas não espaços em branco, caracteres inválidos, bits não utilizados diferentes de zero nem UTF-8 inválido. Arquivos binários arbitrários não são aceitos.",
      "Substitutos UTF-16 sem par são rejeitados em vez de substituídos. Entradas grandes usam um Worker cancelável com tempo limite de 5 segundos. A entrada não é armazenada nem transmitida."
    ]
  },
  "data-units": {
    "introduction": "Converta bits e bytes com fatores SI/IEC exatos, separadamente para tamanhos e taxas de transferência.",
    "steps": [
      "Insira um valor ou use o botão de exemplo. Escolha o formato de conversão e o contexto relevante, se houver.",
      "Examine a saída e a tabela de detalhes; use Copiar ou Baixar para exportar o resultado gerado."
    ],
    "exampleInput": "1 (MiB → B)",
    "exampleResult": "1 MiB = 1,048,576 B; 1 MiB = 8,388,608 b. MB do SI não é o mesmo que MiB da IEC.",
    "limitations": [
      "Somente valores decimais (até 96 caracteres e 24 casas decimais). SI usa 1000; IEC usa 1024. Resultados marcados com ≈ são truncados após 24 casas decimais. Valores negativos são matemáticos, não tamanhos de arquivo válidos.",
      "Executado somente no navegador. Os dados nunca são enviados a uma API nem salvos nas configurações, no histórico ou em URLs."
    ]
  },
  "css-units": {
    "introduction": "Compare unidades de comprimento CSS usando dimensões explícitas da raiz, do elemento e da janela.",
    "steps": [
      "Insira um valor ou use o botão de exemplo. Escolha o formato de conversão e o contexto relevante, se houver.",
      "Examine a saída e a tabela de detalhes; use Copiar ou Baixar para exportar o resultado gerado."
    ],
    "exampleInput": "16 px; root font 16 px, element font 16 px, viewport 1440 × 900 px",
    "exampleResult": "16 px = 1 rem = 1 em; 16 px ≈ 1.111111 vw com este tamanho de janela.",
    "limitations": [
      "Insira um comprimento, os tamanhos de fonte considerados para a raiz e o elemento e a largura/altura da janela, tudo em px CSS. em se baseia no tamanho de fonte informado para o elemento. Frações são arredondadas a seis casas decimais; % e consultas de contêiner não são contemplados.",
      "Executado somente no navegador. Os dados nunca são enviados a uma API nem salvos nas configurações, no histórico ou em URLs."
    ]
  },
  "unicode-normalize": {
    "introduction": "Compare pontos de código NFC, NFD, NFKC e NFKD sem alterar o original.",
    "steps": [
      "Insira um valor ou use o botão de exemplo. Escolha o formato de conversão e o contexto relevante, se houver.",
      "Examine a saída e a tabela de detalhes; use Copiar ou Baixar para exportar o resultado gerado."
    ],
    "exampleInput": "é (e plus U+0301 COMBINING ACUTE ACCENT)",
    "exampleResult": "NFC produz é (U+00E9); NFD mantém U+0065 U+0301. As formas de compatibilidade podem alterar outros caracteres.",
    "limitations": [
      "Até 16 KiB de texto UTF-8. A tabela mostra no máximo 32 pontos de código por forma. A normalização de compatibilidade pode remover distinções; substitutos UTF-16 sem par são preservados pelo JavaScript.",
      "Executado somente no navegador. Os dados nunca são enviados a uma API nem salvos nas configurações, no histórico ou em URLs."
    ]
  },
  "slug": {
    "introduction": "Crie slugs ASCII ou Unicode estáveis a partir de linhas de texto, com sufixos para resolver colisões.",
    "steps": [
      "Insira um valor ou use o botão de exemplo. Escolha o formato de conversão e o contexto relevante, se houver.",
      "Examine a saída e a tabela de detalhes; use Copiar ou Baixar para exportar o resultado gerado."
    ],
    "exampleInput": "Hello World\nHello World",
    "exampleResult": "hello-world e hello-world-2. As colisões são resolvidas entre as linhas não vazias fornecidas.",
    "limitations": [
      "Até 16 KiB e 100 linhas não vazias. Usa NFKD, depois converte para minúsculas e substitui separadores. O modo ASCII remove marcas combinantes, mas não translitera japonês, chinês ou outras escritas. Slugs repetidos recebem sufixos -2 / _2.",
      "Executado somente no navegador. Os dados nunca são enviados a uma API nem salvos nas configurações, no histórico ou em URLs."
    ]
  },
  "unicode-escape": {
    "introduction": "Codifique e decodifique pontos de código U+ e escapes Unicode do JavaScript sem avaliar código.",
    "steps": [
      "Insira um valor ou use o botão de exemplo. Escolha o formato de conversão e o contexto relevante, se houver.",
      "Examine a saída e a tabela de detalhes; use Copiar ou Baixar para exportar o resultado gerado."
    ],
    "exampleInput": "A😀",
    "exampleResult": "No modo U+, a codificação gera U+0041 U+1F600; a decodificação estrita recupera A😀.",
    "limitations": [
      "Até 16 KiB. A decodificação aceita apenas tokens U+XXXX ou tokens de escape JS completos, não JavaScript arbitrário. Substitutos UTF-16 isolados, escapes malformados e valores fora do intervalo geram erros.",
      "Executado somente no navegador. Os dados nunca são enviados a uma API nem salvos nas configurações, no histórico ou em URLs."
    ]
  },
  "csv": {
    "introduction": "Verifique uma tabela antes de importá-la: examine valores ausentes, tipos misturados e cabeçalhos repetidos sem reescrever células. Os perfis de colunas e a prévia de linhas ajudam a localizar problemas de qualidade dos dados.",
    "steps": [
      "Cole texto CSV ou TSV, ou abra um arquivo UTF-8. Selecione o delimitador e indique se a primeira linha contém cabeçalhos.",
      "Revise as contagens de linhas e colunas, as células vazias e os tipos inferidos. Clique em Executar se a aplicação automática estiver desativada."
    ],
    "exampleResult": "Com a vírgula como separador e os cabeçalhos ativados, há 3 linhas de dados e 2 colunas. A coluna score tem 1 célula vazia; os outros valores são inferidos como inteiros.",
    "limitations": [
      "Até 16 MiB, 100.000 registros e 256 colunas. Os tipos são inferidos; os valores das células permanecem como texto. A prévia de linhas e o acompanhamento de valores distintos têm limites de exibição ou acompanhamento."
    ],
    "exampleInput": "name,score\nAda,98\nLinus,\nGrace,99"
  },
  "logs": {
    "introduction": "Reduza um log extenso às linhas relevantes, examine as contagens por nível e encontre mensagens repetidas. Isso ajuda a identificar sinais frequentes durante a investigação de um incidente.",
    "steps": [
      "Cole logs ou abra um arquivo UTF-8. Opcionalmente, insira uma expressão regular como ERROR|WARN.",
      "Examine as contagens de correspondências, os níveis, as linhas repetidas e a prévia. Ative a comparação sem distinguir maiúsculas e minúsculas se necessário."
    ],
    "exampleResult": "O filtro ERROR|WARN corresponde a 3 linhas. ERROR database timeout aparece duas vezes com texto idêntico e há 1 linha WARN.",
    "limitations": [
      "Os logs e o filtro aceitam até 16 MiB em conjunto, com no máximo 100.000 linhas de log. Os filtros usam a sintaxe de expressões regulares do Rust, sem lookaround nem referências anteriores. A detecção de níveis é heurística e a prévia exibida é limitada."
    ],
    "exampleInput": "INFO server ready\nERROR database timeout\nWARN retrying\nERROR database timeout"
  },
  "sets": {
    "introduction": "Compare listas por linhas como conjuntos para extrair itens em comum, itens exclusivos de uma lista ou o conteúdo combinado. Os resultados sem duplicatas mantêm a ordem de entrada.",
    "steps": [
      "Insira um item por linha nas listas A e B. Os marcadores A: e B: do exemplo apenas separam as entradas; não os cole.",
      "Escolha interseção, união ou uma operação de diferença. Revise as opções de linhas vazias, espaços nas extremidades e distinção entre maiúsculas e minúsculas."
    ],
    "exampleResult": "A interseção é Rust. A união é Vue, Rust, Go, nessa ordem; Vue aparece uma vez, embora esteja repetido em A.",
    "limitations": [
      "As duas listas aceitam até 16 MiB e 100.000 linhas em conjunto. Cada linha completa é um item. O modo que ignora maiúsculas e minúsculas usa a conversão para minúsculas do Unicode, não o case folding completo. A prévia mostra os primeiros 1.000 itens; copiar e baixar incluem todos os resultados."
    ],
    "exampleInput": "A:\nVue\nRust\nVue\n\nB:\nRust\nGo"
  },
  "cidr": {
    "introduction": "Calcule intervalos de rede IPv4 e IPv6, máscaras e contagens exatas de endereços a partir da notação CIDR. Você também pode verificar se o endereço fornecido tem bits de host definidos.",
    "steps": [
      "Insira um endereço IP e um comprimento de prefixo, como 192.0.2.130/26.",
      "Examine o endereço de rede, o último endereço, a máscara e a quantidade de endereços. Os intervalos de hosts IPv4 também são exibidos quando aplicáveis."
    ],
    "exampleResult": "A rede é 192.0.2.128/26, o último endereço é 192.0.2.191 e a máscara é 255.255.255.192. Ela contém 64 endereços; o intervalo comum de hosts IPv4 vai de .129 a .190.",
    "limitations": [
      "São apenas cálculos de intervalos: sem consultas DNS, requisições de rede ou varreduras. O broadcast IPv4 e as contagens de hosts utilizáveis não se aplicam ao IPv6."
    ],
    "exampleInput": "192.0.2.130/26"
  },
  "unicode": {
    "introduction": "Examine strings que parecem idênticas, mas não correspondem, ou encontre caracteres invisíveis em código colado. As ocorrências identificam pontos de código e posições, com uma visualização rotulada dos caracteres ocultos.",
    "steps": [
      "Cole o texto original. Opcionalmente, inclua espaços em branco e quebras de linha comuns na inspeção.",
      "Revise os pontos de código, linhas, colunas, categorias e a visualização. Decida se cada caractere é intencional antes de removê-lo."
    ],
    "exampleResult": "Há 1 U+200B ZERO WIDTH SPACE entre user e Name. A string parece userName, mas o original contém um caractere adicional.",
    "limitations": [
      "Até 512 KiB e 1.000 ocorrências exibidas. A ferramenta diagnostica o texto sem corrigi-lo automaticamente. Caracteres de junção e marcas de direção podem ser intencionais em idiomas ou emojis."
    ],
    "exampleInput": "user​Name"
  },
  "json-diff": {
    "introduction": "Compare a estrutura e os valores de JSON ignorando espaços em branco e a ordem das chaves dos objetos. Valores adicionados, removidos e alterados são identificados por caminhos JSON Pointer.",
    "steps": [
      "Insira o JSON anterior e o posterior nos dois campos. Os marcadores A: e B: do exemplo separam as entradas e não fazem parte do JSON.",
      "Revise o tipo e o caminho de cada alteração. Estruturas e valores idênticos são considerados iguais mesmo quando a formatação é diferente."
    ],
    "exampleResult": "/count muda de 1 para 2 e /tag é adicionado com o valor new. Mover a chave active não gera diferença porque seu valor não mudou.",
    "limitations": [
      "Cada entrada é limitada a 512 KiB e profundidade 64. A ordem dos arrays importa. Chaves duplicadas e números que perdem precisão são rejeitados; atingir o limite de alterações gera um resultado indicado como parcial."
    ],
    "exampleInput": "A:\n{\"count\":1,\"active\":true}\n\nB:\n{\"active\":true,\"count\":2,\"tag\":\"new\"}"
  },
  "json-format": {
    "introduction": "Valide a sintaxe JSON e gere uma saída com recuo legível ou compacta. A ferramenta muda a formatação preservando as chaves e os valores.",
    "steps": [
      "Cole JSON ou abra um arquivo UTF-8.",
      "Escolha um recuo de 2, 4 ou 8 espaços, ou selecione Minificar. Revise a saída formatada e copie ou baixe."
    ],
    "exampleResult": "Com recuo de 2 espaços, name, scores e active são exibidos com quebras de linha e recuo. Minificar remove espaços em branco desnecessários preservando a ordem dos arrays e os valores.",
    "limitations": [
      "Até 512 KiB e profundidade 64. Chaves duplicadas e números que perdem precisão são rejeitados. Comentários JSONC e vírgulas finais não são aceitos."
    ],
    "exampleInput": "{\"name\":\"Ada\",\"scores\":[98,99],\"active\":true}"
  },
  "contrast": {
    "introduction": "Calcule a taxa de contraste entre primeiro plano e fundo e compare com os limites da WCAG 2.x. A prévia ajuda a examinar a combinação de cores selecionada.",
    "steps": [
      "Insira as cores do texto e do fundo como valores hexadecimais de 3 ou 6 dígitos, como #000000. O exemplo usa texto preto sobre branco.",
      "Revise a taxa e os resultados para texto normal, texto grande e componentes de interface. Altere ou troque as cores para recalcular."
    ],
    "exampleResult": "Preto e branco têm taxa de contraste de 21:1. Isso atende aos limites AA e AAA para texto normal e grande, além do limite para componentes de interface.",
    "limitations": [
      "Somente cores hexadecimais sRGB opacas. Transparência, fundos de imagem e gradientes não são modelados. Esta verificação sozinha não permite determinar a conformidade geral de acessibilidade."
    ],
    "exampleInput": "#000000\n#FFFFFF"
  },
  "har": {
    "introduction": "Leia um HAR exportado do DevTools do navegador para examinar status HTTP, agrupamentos por host e tipo de mídia e requisições lentas. A ferramenta analisa o tráfego registrado localmente.",
    "steps": [
      "Cole JSON HAR ou abra um arquivo HAR UTF-8. Este exemplo contém dados sintéticos com uma requisição.",
      "Revise as contagens de requisições, os erros HTTP, os bytes de resposta conhecidos e as durações. Alterne entre o agrupamento por host e por tipo de mídia."
    ],
    "exampleResult": "A única requisição é contada como um erro HTTP 503. Sua duração registrada é de 250 ms e o tamanho conhecido da resposta é de 120 bytes: headersSize mais bodySize.",
    "limitations": [
      "Até 16 MiB e 100.000 entradas. As URLs registradas nunca são acessadas. Tamanhos e tempos desconhecidos permanecem desconhecidos. A soma das durações de requisições simultâneas não é o tempo de carregamento da página."
    ],
    "exampleInput": "{\"log\":{\"version\":\"1.2\",\"entries\":[{\"request\":{\"method\":\"GET\",\"url\":\"https://example.test/api\"},\"response\":{\"status\":503,\"headersSize\":100,\"bodySize\":20,\"content\":{\"mimeType\":\"application/json\"}},\"time\":250}]}}"
  },
  "env": {
    "introduction": "Compare duas configurações .env por chave para encontrar valores alterados, chaves ausentes, definições duplicadas e linhas malformadas. Os valores ficam ocultos na tabela por padrão.",
    "steps": [
      "Insira .env A e .env B. Os marcadores A: e B: do exemplo separam as entradas e devem ser omitidos.",
      "Revise as chaves com diferenças e os diagnósticos. Opcionalmente, revele os valores ou inclua chaves sem alterações."
    ],
    "exampleResult": "LOG_LEVEL muda de debug para info. OLD_FLAG está somente em A e CACHE está somente em B. APP_NAME não muda e é omitido da visualização padrão de alterações.",
    "limitations": [
      "Cada entrada aceita até 256 KiB, 10.000 linhas e 2.000 definições. Não há expansão de variáveis ou comandos; a última definição válida prevalece. Outras implementações de dotenv podem ser diferentes. Copiar e baixar incluem os valores ocultos."
    ],
    "exampleInput": "A:\nAPP_NAME=demo\nLOG_LEVEL=debug\nOLD_FLAG=true\n\nB:\nAPP_NAME=demo\nLOG_LEVEL=info\nCACHE=true"
  },
  "url": {
    "introduction": "Examine o esquema, o host, o caminho e o fragmento de uma URL e edite os parâmetros de consulta individualmente. O editor mantém chaves duplicadas e a ordem dos parâmetros enquanto exibe a URL resultante.",
    "steps": [
      "Insira uma URL absoluta com esquema e host. A ferramenta não abre o site de destino.",
      "Revise os componentes e edite, adicione ou remova chaves e valores de consulta. Copie a URL resultante quando estiver pronta."
    ],
    "exampleResult": "O host é example.test, o caminho é /search e o fragmento é results. tag tem duas entradas, vue e rust; q vira hello world porque + é decodificado como espaço.",
    "limitations": [
      "Até 16 KiB e 200 parâmetros de consulta. O analisador padrão de URLs pode normalizar o endereço. A edição de parâmetros codifica espaços como + e sinais de mais literais como %2B e omite segmentos & vazios. Nenhuma requisição é feita à URL."
    ],
    "exampleInput": "https://example.test/search?tag=vue&tag=rust&q=hello+world#results"
  },
  "shortcuts": {
    "introduction": "Consulte atalhos padrão documentados de aplicativos em um dicionário local usando uma combinação ou sequência de teclas. Filtre por sistema operacional, aplicativo e ação e examine o contexto e as fontes de cada atalho.",
    "steps": [
      "Digite um atalho na entrada manual ou dê foco ao campo de captura e pressione o atalho. Separe os pressionamentos em sequência com then; até 4 pressionamentos são aceitos.",
      "Escolha um sistema operacional e um aplicativo e depois correspondência exata ou sequência contida. Revise a ação, as condições de foco, o escopo da documentação e a fonte de cada resultado."
    ],
    "exampleResult": "Com Windows, Visual Studio Code e correspondência exata selecionados, é encontrado o atalho de dois pressionamentos para adicionar comentários de linha no editor. Pressione Ctrl+K e depois Ctrl+C; K e C não são pressionados juntos.",
    "limitations": [
      "A ferramenta não detecta aplicativos em execução nem processos que usam uma tecla. A ausência de resultados no dicionário não comprova que um atalho não seja usado ou esteja livre de conflitos. Configurações personalizadas, versões, foco e layouts de teclado podem mudar o comportamento.",
      "As teclas são capturadas apenas enquanto o campo específico tem foco. Tab move o foco e Escape sai da captura. Insira manualmente as teclas reservadas pelo sistema operacional ou navegador. Ctrl e Command são modificadores distintos."
    ],
    "exampleInput": "Ctrl+K then Ctrl+C"
  },
  "explain": {
    "introduction": "Leia a saída de PostgreSQL EXPLAIN FORMAT JSON para examinar os nós do plano, as linhas estimadas em comparação às reais e os tempos registrados. Nenhum SQL é executado e nenhuma conexão com banco de dados é feita.",
    "steps": [
      "Cole um EXPLAIN JSON existente. As linhas reais e os tempos ficam disponíveis quando a saída original inclui dados de ANALYZE.",
      "Examine a lista de nós, opcionalmente filtrando por tipo de nó ou nome de relação. Compare as estimativas com as linhas reais."
    ],
    "exampleResult": "Há um nó Seq Scan para users. Ele estima 1.000 linhas e registra 10 linhas reais por iteração, uma proporção real/estimado de 0.01. O tempo de execução registrado é de 0.3 ms.",
    "limitations": [
      "Até 512 KiB, profundidade 64, 20 instruções e 1.000 nós. Actual Rows e os tempos dos nós são médias por iteração. Os tempos dos nós pais incluem os filhos, por isso os tempos dos nós nunca são somados."
    ],
    "exampleInput": "[{\"Plan\":{\"Node Type\":\"Seq Scan\",\"Relation Name\":\"users\",\"Plan Rows\":1000,\"Actual Rows\":10,\"Actual Loops\":1,\"Actual Total Time\":0.2},\"Execution Time\":0.3}]"
  }
} satisfies Record<ToolId, ToolGuide>;
