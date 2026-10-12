import type { ToolGuide, GuideLabels } from '../guide-schema.ts';
import type { ToolId } from '../catalog.ts';

export const guideLabelsEs = {
  "usage": "Cómo usarla",
  "example": "Ejemplo e interpretación",
  "exampleInput": "Entrada de ejemplo",
  "exampleResult": "Qué significa el resultado",
  "limitations": "Entradas admitidas y límites",
  "languages": "Idioma de la página",
  "allTools": "Todas las herramientas",
  "useTool": "Usar la herramienta en esta página",
  "javascript": "Puedes leer la guía y los ejemplos sin JavaScript. Activa JavaScript para utilizar la herramienta.",
  "availability": "Esta guía está disponible tanto si la herramienta está activada como si está desactivada. El espacio de trabajo interactivo respeta las preferencias guardadas en este navegador.",
  "disabledTitle": "Esta herramienta está desactivada",
  "disabled": "Esta herramienta está desactivada en este navegador. Actívala en Configuración para usarla. Abrir su guía no cambia tus preferencias.",
  "privacy": "Las entradas se procesan en la memoria del navegador. No se envían a ningún destino, no se almacenan ni se incluyen en la URL de la página. Solo se guardan las preferencias."
} satisfies GuideLabels;

export const toolGuidesEs = {
  "html-entities": {
    "introduction": "Codifica texto de forma segura como referencias de caracteres HTML y decodifica un conjunto documentado de referencias con nombre o referencias numéricas válidas sin interpretar el marcado.",
    "steps": [
      "Selecciona la dirección y el escape mínimo o completo e introduce el texto.",
      "Examina y copia el resultado. La decodificación se realiza en una sola pasada."
    ],
    "exampleInput": "<p title=\"Hello\">A & B 👋</p>",
    "exampleResult": "La codificación mínima produce &lt;p title=&quot;Hello&quot;&gt;A &amp; B 👋&lt;/p&gt;. El modo completo convierte los caracteres no ASCII en referencias numéricas.",
    "limitations": [
      "Máximo 64 KiB de entrada. La decodificación de referencias con nombre solo admite amp/lt/gt/quot/apos/nbsp/copy/reg/trade/euro/hellip/mdash/ndash/times/divide. Las referencias desconocidas o no válidas se mantienen literales. El marcado nunca se ejecuta."
    ]
  },
  "url-encode": {
    "introduction": "Convierte cadenas con codificación porcentual de componente, formulario o ruta con barras conservadas; no se visita ninguna URL.",
    "steps": [
      "Elige la dirección de la transformación y el modo de codificación e introduce una cadena.",
      "Examina y copia el resultado."
    ],
    "exampleInput": "A B/日+?",
    "exampleResult": "El modo de componente codifica A B/日+? como A%20B%2F%E6%97%A5%2B%3F; el modo de ruta conserva la barra.",
    "limitations": [
      "Máximo 64 KiB de entrada. Solo el modo de formulario interpreta + como espacio al decodificar. Los escapes incorrectos y el UTF-8 mal formado producen errores. Esta herramienta no analiza ni solicita URL."
    ]
  },
  "dummy-text": {
    "introduction": "Genera texto de relleno reproducible a partir de frases sintéticas fijas en seis estilos de idioma.",
    "steps": [
      "Elige el idioma, párrafos/frases/caracteres, la cantidad y la semilla.",
      "Copia o descarga la salida."
    ],
    "exampleInput": "language=ja; unit=paragraphs; count=3; seed=42",
    "exampleResult": "Japonés / 3 párrafos / semilla 42 siempre produce los mismos tres párrafos.",
    "limitations": [
      "Máximo 30 párrafos, 120 frases o 10.000 valores escalares Unicode; salida máxima de 64 KiB. Las frases son sintéticas, no datos personales reales."
    ]
  },
  "css-specificity": {
    "introduction": "Compara la especificidad (a,b,c) de los selectores CSS, con la contribución de cada token.",
    "steps": [
      "Introduce uno o más selectores separados por comas.",
      "Revisa las puntuaciones de los componentes y copia el informe."
    ],
    "exampleInput": "main#app .card:hover::before, p:where(#preview) > a",
    "exampleResult": "El primer selector obtiene (1,2,2) y el segundo (0,0,2). :where aporta cero.",
    "limitations": [
      "Máximo 4.096 caracteres, 32 selectores y 8 niveles de anidamiento. Admite un subconjunto estricto de Selectors 4; los & anidados y las pseudofunciones no admitidas producen errores, sin hacer suposiciones."
    ]
  },
  "fluid-type": {
    "introduction": "Genera un clamp de CSS con interpolación lineal a partir de dos pares de ancho de ventana y tamaño de fuente.",
    "steps": [
      "Introduce los límites inferior y superior del tamaño de fuente y del ancho de ventana, además de la base de px por rem.",
      "Mueve el control deslizante de la vista previa y copia el CSS generado."
    ],
    "exampleInput": "minSize=16px; maxSize=24px; minViewport=320px; maxViewport=1280px; rootSize=16px",
    "exampleResult": "El ejemplo produce font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem);",
    "limitations": [
      "Tamaños de fuente de 0,5–256 px, anchos de 240–10.000 px y base de 8–32 px. Los anchos de ventana deben ir en orden creciente. Los coeficientes CSS se redondean a seis decimales; el valor real de rem depende del tamaño de fuente raíz del navegador."
    ]
  },
  "cubic-bezier": {
    "introduction": "Ajusta una función de temporización CSS con una curva muestreada y una vista previa del movimiento.",
    "steps": [
      "Edita los controles o pega la entrada. Todo el procesamiento se realiza en este navegador.",
      "Revisa el resultado y cópialo o descárgalo si lo necesitas."
    ],
    "exampleInput": "x1=.25, y1=.1, x2=.25, y2=1; duration=600 ms",
    "exampleResult": "cubic-bezier(0.25, 0.1, 0.25, 1)",
    "limitations": [
      "x1/x2 deben estar entre 0–1; y1/y2, entre −5–5; duración entre 50–20.000 ms. La curva se muestrea y la vista previa respeta la preferencia de movimiento reducido."
    ]
  },
  "css-gradient": {
    "introduction": "Crea degradados lineales y radiales con paradas de color editables.",
    "steps": [
      "Edita los controles o pega la entrada. Todo el procesamiento se realiza en este navegador.",
      "Revisa el resultado y cópialo o descárgalo si lo necesitas."
    ],
    "exampleInput": "linear 90deg; #3366FF 0%, #FF8C00CC 100%",
    "exampleResult": "linear-gradient(90deg, #3366FF 0%, #FF8C00CC 100%)",
    "limitations": [
      "De 2 a 8 paradas de color con HEX de seis u ocho dígitos y posiciones de 0–100%. La interpolación del navegador sigue CSS; sin acceso a la red."
    ]
  },
  "svg-placeholder": {
    "introduction": "Crea una imagen SVG o PNG con una etiqueta de texto para descargarla localmente.",
    "steps": [
      "Edita los controles o pega la entrada. Todo el procesamiento se realiza en este navegador.",
      "Revisa el resultado y cópialo o descárgalo si lo necesitas."
    ],
    "exampleInput": "640×360, #2D5B8A, label='640 × 360'",
    "exampleResult": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...>…</svg> (exportación SVG y PNG)",
    "limitations": [
      "Dimensiones de 1–4096 px (máx. 4 MP); etiqueta de hasta 160 bytes UTF-8. El SVG se escapa y no contiene scripts ni URL."
    ]
  },
  "path-batch": {
    "introduction": "Previsualiza cambios de prefijo, mayúsculas, numeración y separadores sin modificar archivos.",
    "steps": [
      "Edita los controles o pega la entrada. Todo el procesamiento se realiza en este navegador.",
      "Revisa el resultado y cópialo o descárgalo si lo necesitas."
    ],
    "exampleInput": "src/Report.txt\nsrc/report.txt; suffix=-new",
    "exampleResult": "src/Report-new.txt / src/report-new.txt; posible colisión si no se distinguen mayúsculas y minúsculas",
    "limitations": [
      "Hasta 500 líneas / 64 KiB; nunca se renombran archivos. La detección de colisiones ignora mayúsculas y minúsculas y es aproximada en sistemas distintos de Windows."
    ]
  },
  "color-palette": {
    "introduction": "Genera muestras de colores análogos, complementarios o triádicos basadas en HSL.",
    "steps": [
      "Edita los controles o pega la entrada. Todo el procesamiento se realiza en este navegador.",
      "Revisa el resultado y cópialo o descárgalo si lo necesitas."
    ],
    "exampleInput": "base=#3366FF, count=5, analogous",
    "exampleResult": "Cinco tonos HSL deterministas y variables CSS que puedes copiar",
    "limitations": [
      "De 2 a 8 colores sRGB a partir de HEX, con alfa opcional. La armonía HSL no garantiza el contraste exigido por WCAG."
    ]
  },
  "chmod": {
    "introduction": "Examina los bits de permisos de archivos Linux antes de cambiar un modo. Convierte entre valores octales y casillas rwx, previsualiza cambios simbólicos con destinatarios explícitos y compara los permisos de creación según umask.",
    "steps": [
      "Introduce tres o cuatro dígitos octales o selecciona un ejemplo y ajusta propietario, grupo, otros y bits especiales. Los cálculos pequeños se actualizan al instante.",
      "Previsualiza una expresión con clases explícitas, como u+x,g-w,o=. Elige el comportamiento de directorio cuando sea necesario. Pulsa Usar vista previa para reemplazar el modo seleccionado.",
      "Introduce umask por separado para ver ejemplos habituales de creación de archivos y directorios. Copia el comando GNU/Linux cuando lo necesites; sustituye ./path antes de usarlo."
    ],
    "exampleInput": "mode: 0644\nsymbolic: u+x,g-w,o=\numask: 022",
    "exampleResult": "0644 equivale a rw-r--r--. La vista previa simbólica es 0740 (rwxr-----). Con modos de creación solicitados de 0666/0777 y sin ACL predeterminada, umask 022 produce 0644 para archivos y 0755 para directorios.",
    "limitations": [
      "Esta es una calculadora de 12 bits, no un simulador de acceso efectivo ni de sistemas de archivos. No se ejecutan comandos; las ACL, el propietario, los permisos de los directorios padres y las opciones de montaje quedan fuera del alcance.",
      "La entrada simbólica requiere u/g/o/a explícitos, un operador +, - o = por cláusula y rwxst. No admite X, copia de permisos ni espacios internos. Máximo 256 bytes UTF-8 y 32 cláusulas; las entradas octales y umask admiten como máximo 16 caracteres sin procesar.",
      "En directorios, = conserva setuid/setgid si no se mencionan; u-s/g-s explícitos los borran. El operando octal GNU de cinco dígitos que se copia controla todos los bits especiales. Los ejemplos de umask son independientes de chmod."
    ]
  },
  "base64": {
    "introduction": "Codifica texto UTF-8 a Base64 o decodifica Base64 a UTF-8. La conversión se realiza íntegramente en tu navegador.",
    "steps": [
      "Elige codificar o decodificar y el alfabeto estándar o seguro para URL e introduce el texto.",
      "Las entradas cortas se actualizan al instante. Los textos largos se procesan en un Worker tras una breve pausa; también puedes aplicarlos manualmente.",
      "Copia o descarga el resultado, o intercámbialo con la entrada para hacer la conversión inversa."
    ],
    "exampleInput": "こんにちは 👋",
    "exampleResult": "La codificación estándar produce 44GT44KT44Gr44Gh44GvIPCfkYs= y convierte 20 bytes UTF-8 en 28 caracteres Base64.",
    "limitations": [
      "La entrada se limita a 256 KiB. La salida estándar usa relleno con =; la salida segura para URL sustituye + y / y omite el relleno.",
      "La decodificación acepta texto canónico con o sin relleno, pero no espacios en blanco, caracteres no válidos, bits no utilizados distintos de cero ni UTF-8 no válido. No se admiten archivos binarios arbitrarios.",
      "Los sustitutos UTF-16 sin pareja se rechazan en lugar de reemplazarse. Las entradas grandes usan un Worker cancelable con un tiempo límite de 5 segundos. La entrada no se almacena ni se transmite."
    ]
  },
  "data-units": {
    "introduction": "Convierte bits y bytes con factores SI/IEC exactos, por separado para tamaños y tasas de transferencia.",
    "steps": [
      "Introduce un valor o usa el botón de ejemplo. Elige el formato de conversión y el contexto pertinente, si lo hay.",
      "Examina la salida y la tabla de detalles; usa Copiar o Descargar para exportar el resultado generado."
    ],
    "exampleInput": "1 (MiB → B)",
    "exampleResult": "1 MiB = 1,048,576 B; 1 MiB = 8,388,608 b. MB del SI no equivale a MiB de IEC.",
    "limitations": [
      "Solo valores decimales (hasta 96 caracteres y 24 cifras decimales). SI usa 1000; IEC usa 1024. Los resultados marcados con ≈ se truncan tras 24 decimales. Los valores negativos son matemáticos, no tamaños de archivo válidos.",
      "Se ejecuta solo en el navegador. Los datos nunca se envían a una API ni se guardan en la configuración, el historial o las URL."
    ]
  },
  "css-units": {
    "introduction": "Compara unidades de longitud CSS con dimensiones explícitas de la raíz, el elemento y la ventana.",
    "steps": [
      "Introduce un valor o usa el botón de ejemplo. Elige el formato de conversión y el contexto pertinente, si lo hay.",
      "Examina la salida y la tabla de detalles; usa Copiar o Descargar para exportar el resultado generado."
    ],
    "exampleInput": "16 px; root font 16 px, element font 16 px, viewport 1440 × 900 px",
    "exampleResult": "16 px = 1 rem = 1 em; 16 px ≈ 1.111111 vw con este tamaño de ventana.",
    "limitations": [
      "Introduce una longitud, los tamaños de fuente supuestos para la raíz y el elemento y el ancho/alto de la ventana, todo en px CSS. em se basa en el tamaño de fuente del elemento indicado. Las fracciones se redondean a seis decimales; no se incluyen % ni consultas de contenedor.",
      "Se ejecuta solo en el navegador. Los datos nunca se envían a una API ni se guardan en la configuración, el historial o las URL."
    ]
  },
  "unicode-normalize": {
    "introduction": "Compara puntos de código NFC, NFD, NFKC y NFKD sin modificar el original.",
    "steps": [
      "Introduce un valor o usa el botón de ejemplo. Elige el formato de conversión y el contexto pertinente, si lo hay.",
      "Examina la salida y la tabla de detalles; usa Copiar o Descargar para exportar el resultado generado."
    ],
    "exampleInput": "é (e plus U+0301 COMBINING ACUTE ACCENT)",
    "exampleResult": "NFC produce é (U+00E9); NFD conserva U+0065 U+0301. Las formas de compatibilidad pueden cambiar otros caracteres.",
    "limitations": [
      "Hasta 16 KiB de texto UTF-8. La tabla muestra como máximo 32 puntos de código por forma. La normalización de compatibilidad puede eliminar distinciones; JavaScript conserva los sustitutos UTF-16 sin pareja.",
      "Se ejecuta solo en el navegador. Los datos nunca se envían a una API ni se guardan en la configuración, el historial o las URL."
    ]
  },
  "slug": {
    "introduction": "Crea slugs ASCII o Unicode estables a partir de líneas de texto, con sufijos para resolver colisiones.",
    "steps": [
      "Introduce un valor o usa el botón de ejemplo. Elige el formato de conversión y el contexto pertinente, si lo hay.",
      "Examina la salida y la tabla de detalles; usa Copiar o Descargar para exportar el resultado generado."
    ],
    "exampleInput": "Hello World\nHello World",
    "exampleResult": "hello-world y hello-world-2. Las colisiones se resuelven entre las líneas no vacías proporcionadas.",
    "limitations": [
      "Hasta 16 KiB y 100 líneas no vacías. Aplica NFKD, después convierte a minúsculas y reemplaza separadores. El modo ASCII elimina marcas combinantes, pero no translitera japonés, chino ni otras escrituras. Los slugs repetidos reciben sufijos -2 / _2.",
      "Se ejecuta solo en el navegador. Los datos nunca se envían a una API ni se guardan en la configuración, el historial o las URL."
    ]
  },
  "unicode-escape": {
    "introduction": "Codifica y decodifica puntos de código U+ y escapes Unicode de JavaScript sin evaluar código.",
    "steps": [
      "Introduce un valor o usa el botón de ejemplo. Elige el formato de conversión y el contexto pertinente, si lo hay.",
      "Examina la salida y la tabla de detalles; usa Copiar o Descargar para exportar el resultado generado."
    ],
    "exampleInput": "A😀",
    "exampleResult": "En modo U+, la codificación produce U+0041 U+1F600; la decodificación estricta recupera A😀.",
    "limitations": [
      "Hasta 16 KiB. La decodificación solo acepta tokens U+XXXX o tokens de escape JS completos, no JavaScript arbitrario. Los sustitutos UTF-16 aislados, los escapes mal formados y los valores fuera de rango producen errores.",
      "Se ejecuta solo en el navegador. Los datos nunca se envían a una API ni se guardan en la configuración, el historial o las URL."
    ]
  },
  "csv": {
    "introduction": "Comprueba una tabla antes de importarla: examina valores ausentes, tipos mezclados y cabeceras repetidas sin reescribir celdas. Los perfiles de columnas y la vista previa de filas ayudan a localizar problemas de calidad de los datos.",
    "steps": [
      "Pega texto CSV o TSV, o abre un archivo UTF-8. Selecciona el delimitador e indica si la primera fila contiene cabeceras.",
      "Revisa los recuentos de filas y columnas, las celdas vacías y los tipos inferidos. Pulsa Ejecutar si la aplicación automática está desactivada."
    ],
    "exampleResult": "Con la coma como separador y las cabeceras activadas, hay 3 filas de datos y 2 columnas. La columna score tiene 1 celda vacía; sus demás valores se infieren como enteros.",
    "limitations": [
      "Hasta 16 MiB, 100.000 registros y 256 columnas. Los tipos se infieren; los valores de las celdas permanecen como texto. La vista previa de filas y el seguimiento de valores distintos tienen límites de visualización o seguimiento."
    ],
    "exampleInput": "name,score\nAda,98\nLinus,\nGrace,99"
  },
  "logs": {
    "introduction": "Reduce un registro extenso a las líneas relevantes, examina los recuentos por nivel y detecta mensajes repetidos. Esto ayuda a identificar indicios frecuentes al investigar un incidente.",
    "steps": [
      "Pega registros o abre un archivo UTF-8. Opcionalmente, introduce una expresión regular como ERROR|WARN.",
      "Examina los recuentos de coincidencias, los niveles, las líneas repetidas y la vista previa. Activa la comparación sin distinguir mayúsculas y minúsculas si es necesario."
    ],
    "exampleResult": "El filtro ERROR|WARN coincide con 3 líneas. ERROR database timeout aparece dos veces con un texto idéntico y hay 1 línea WARN.",
    "limitations": [
      "Los registros y el filtro admiten hasta 16 MiB en conjunto, con un máximo de 100.000 líneas de registro. Los filtros usan la sintaxis de expresiones regulares de Rust, sin aserciones de anticipación o retrospección ni referencias hacia atrás. La detección de niveles es heurística y la vista previa está limitada."
    ],
    "exampleInput": "INFO server ready\nERROR database timeout\nWARN retrying\nERROR database timeout"
  },
  "sets": {
    "introduction": "Compara listas por líneas como conjuntos para extraer elementos comunes, elementos exclusivos de una lista o el contenido combinado. Los resultados sin duplicados conservan el orden de entrada.",
    "steps": [
      "Introduce un elemento por línea en las listas A y B. Los marcadores A: y B: del ejemplo solo separan las entradas; no los pegues.",
      "Elige intersección, unión o una operación de diferencia. Revisa las opciones de líneas vacías, espacios en los extremos y distinción entre mayúsculas y minúsculas."
    ],
    "exampleResult": "La intersección es Rust. La unión es Vue, Rust, Go, en ese orden; Vue aparece una sola vez aunque esté repetido en A.",
    "limitations": [
      "Ambas listas admiten hasta 16 MiB y 100.000 líneas en conjunto. Cada línea completa es un elemento. El modo que ignora mayúsculas y minúsculas usa la conversión a minúsculas de Unicode, no el plegado completo de mayúsculas y minúsculas. La vista previa muestra los primeros 1.000 elementos; al copiar o descargar se incluyen todos los resultados."
    ],
    "exampleInput": "A:\nVue\nRust\nVue\n\nB:\nRust\nGo"
  },
  "cidr": {
    "introduction": "Calcula rangos de red IPv4 e IPv6, máscaras y cantidades exactas de direcciones a partir de la notación CIDR. También puedes comprobar si la dirección proporcionada tiene bits de host activados.",
    "steps": [
      "Introduce una dirección IP y una longitud de prefijo, como 192.0.2.130/26.",
      "Examina la dirección de red, la última dirección, la máscara y el número de direcciones. También se muestran los rangos de hosts IPv4 cuando corresponde."
    ],
    "exampleResult": "La red es 192.0.2.128/26, la última dirección es 192.0.2.191 y la máscara es 255.255.255.192. Contiene 64 direcciones; el rango habitual de hosts IPv4 va de .129 a .190.",
    "limitations": [
      "Solo se hacen cálculos de rangos: sin consultas DNS, solicitudes de red ni escaneos. La difusión IPv4 y los recuentos de hosts utilizables no se aplican a IPv6."
    ],
    "exampleInput": "192.0.2.130/26"
  },
  "unicode": {
    "introduction": "Examina cadenas que parecen idénticas pero no coinciden, o encuentra caracteres invisibles en código pegado. Los hallazgos identifican puntos de código y posiciones, con una visualización etiquetada de los caracteres ocultos.",
    "steps": [
      "Pega el texto original. Opcionalmente, incluye los espacios en blanco y saltos de línea comunes en la inspección.",
      "Revisa los puntos de código, líneas, columnas, categorías y la visualización. Decide si cada carácter es intencionado antes de eliminarlo."
    ],
    "exampleResult": "Hay 1 U+200B ZERO WIDTH SPACE entre user y Name. La cadena parece userName, pero el original contiene un carácter adicional.",
    "limitations": [
      "Hasta 512 KiB y 1.000 hallazgos mostrados. La herramienta diagnostica el texto sin corregirlo automáticamente. Los caracteres de unión y las marcas de dirección pueden ser intencionados en idiomas o emojis."
    ],
    "exampleInput": "user​Name"
  },
  "json-diff": {
    "introduction": "Compara la estructura y los valores de JSON ignorando los espacios en blanco y el orden de las claves de los objetos. Los valores añadidos, eliminados y modificados se identifican mediante rutas JSON Pointer.",
    "steps": [
      "Introduce el JSON anterior y el posterior en los dos campos. Los marcadores A: y B: del ejemplo separan las entradas y no forman parte del JSON.",
      "Revisa el tipo y la ruta de cada cambio. Las estructuras y los valores idénticos se consideran iguales aunque el formato difiera."
    ],
    "exampleResult": "/count cambia de 1 a 2 y se añade /tag con el valor new. Mover la clave active no genera una diferencia porque su valor no ha cambiado.",
    "limitations": [
      "Cada entrada se limita a 512 KiB y profundidad 64. El orden de los arrays importa. Se rechazan las claves duplicadas y los números que pierden precisión; si se alcanza el límite de cambios, se genera un resultado indicado como parcial."
    ],
    "exampleInput": "A:\n{\"count\":1,\"active\":true}\n\nB:\n{\"active\":true,\"count\":2,\"tag\":\"new\"}"
  },
  "json-format": {
    "introduction": "Valida la sintaxis JSON y genera una salida con sangría legible o compacta. La herramienta cambia el formato conservando las claves y los valores.",
    "steps": [
      "Pega JSON o abre un archivo UTF-8.",
      "Elige una sangría de 2, 4 u 8 espacios, o selecciona Minificar. Revisa la salida formateada y cópiala o descárgala."
    ],
    "exampleResult": "Con una sangría de 2 espacios, name, scores y active se muestran con saltos de línea y sangría. Minificar elimina los espacios en blanco innecesarios conservando el orden de los arrays y los valores.",
    "limitations": [
      "Hasta 512 KiB y profundidad 64. Se rechazan las claves duplicadas y los números que pierden precisión. No se admiten comentarios JSONC ni comas finales."
    ],
    "exampleInput": "{\"name\":\"Ada\",\"scores\":[98,99],\"active\":true}"
  },
  "contrast": {
    "introduction": "Calcula la relación de contraste entre primer plano y fondo y compárala con los umbrales de WCAG 2.x. La vista previa te ayuda a examinar la combinación de colores elegida.",
    "steps": [
      "Introduce los colores del texto y del fondo como valores hexadecimales de 3 o 6 dígitos, por ejemplo #000000. El ejemplo usa texto negro sobre blanco.",
      "Revisa la relación y los resultados para texto normal, texto grande y componentes de interfaz. Cambia o intercambia los colores para recalcular."
    ],
    "exampleResult": "El blanco y el negro tienen una relación de contraste de 21:1. Cumple los umbrales AA y AAA para texto normal y grande, así como el umbral para componentes de interfaz.",
    "limitations": [
      "Solo colores hexadecimales sRGB opacos. No se modelan transparencias, fondos de imagen ni degradados. Esta comprobación por sí sola no permite determinar la conformidad general en materia de accesibilidad."
    ],
    "exampleInput": "#000000\n#FFFFFF"
  },
  "har": {
    "introduction": "Lee un HAR exportado desde DevTools del navegador para examinar estados HTTP, agrupaciones por host y tipo de medio y solicitudes lentas. La herramienta analiza localmente el tráfico registrado.",
    "steps": [
      "Pega JSON HAR o abre un archivo HAR UTF-8. Este ejemplo contiene datos sintéticos con una solicitud.",
      "Revisa los recuentos de solicitudes, los errores HTTP, los bytes de respuesta conocidos y las duraciones. Alterna entre la agrupación por host y por tipo de medio."
    ],
    "exampleResult": "La única solicitud se cuenta como un error HTTP 503. Su duración registrada es de 250 ms y el tamaño conocido de su respuesta es de 120 bytes: headersSize más bodySize.",
    "limitations": [
      "Hasta 16 MiB y 100.000 entradas. Nunca se solicitan las URL registradas. Los tamaños y tiempos desconocidos permanecen como desconocidos. La suma de las duraciones de solicitudes simultáneas no es el tiempo de carga de la página."
    ],
    "exampleInput": "{\"log\":{\"version\":\"1.2\",\"entries\":[{\"request\":{\"method\":\"GET\",\"url\":\"https://example.test/api\"},\"response\":{\"status\":503,\"headersSize\":100,\"bodySize\":20,\"content\":{\"mimeType\":\"application/json\"}},\"time\":250}]}}"
  },
  "env": {
    "introduction": "Compara dos configuraciones .env por clave para encontrar valores modificados, claves ausentes, definiciones duplicadas y líneas mal formadas. Los valores se ocultan en la tabla de forma predeterminada.",
    "steps": [
      "Introduce .env A y .env B. Los marcadores A: y B: del ejemplo separan las entradas y deben omitirse.",
      "Revisa las claves con diferencias y los diagnósticos. Opcionalmente, muestra los valores o incluye las claves sin cambios."
    ],
    "exampleResult": "LOG_LEVEL cambia de debug a info. OLD_FLAG solo está en A y CACHE solo está en B. APP_NAME no cambia y se omite en la vista de cambios predeterminada.",
    "limitations": [
      "Cada entrada admite hasta 256 KiB, 10.000 líneas y 2.000 definiciones. No se realiza expansión de variables ni de comandos; prevalece la última definición válida. Otras implementaciones de dotenv pueden diferir. Al copiar o descargar se incluyen los valores ocultos."
    ],
    "exampleInput": "A:\nAPP_NAME=demo\nLOG_LEVEL=debug\nOLD_FLAG=true\n\nB:\nAPP_NAME=demo\nLOG_LEVEL=info\nCACHE=true"
  },
  "url": {
    "introduction": "Examina el esquema, el host, la ruta y el fragmento de una URL y edita individualmente los parámetros de consulta. El editor conserva las claves duplicadas y el orden de los parámetros mientras muestra la URL resultante.",
    "steps": [
      "Introduce una URL absoluta con esquema y host. La herramienta no abre el sitio de destino.",
      "Revisa los componentes y edita, añade o elimina claves y valores de consulta. Copia la URL resultante cuando esté lista."
    ],
    "exampleResult": "El host es example.test, la ruta es /search y el fragmento es results. tag tiene dos entradas, vue y rust; q se convierte en hello world porque + se decodifica como espacio.",
    "limitations": [
      "Hasta 16 KiB y 200 parámetros de consulta. El analizador de URL estándar puede normalizar la dirección. La edición de parámetros codifica los espacios como + y los signos más literales como %2B y omite los segmentos & vacíos. No se hacen solicitudes a la URL."
    ],
    "exampleInput": "https://example.test/search?tag=vue&tag=rust&q=hello+world#results"
  },
  "shortcuts": {
    "introduction": "Consulta atajos predeterminados documentados de aplicaciones en un diccionario local mediante una combinación o secuencia de teclas. Filtra por sistema operativo, aplicación y acción, y examina el contexto y las fuentes de cada atajo.",
    "steps": [
      "Escribe un atajo en la entrada manual o enfoca el campo de captura y púlsalo. Separa las pulsaciones secuenciales con then; se admiten hasta 4 pulsaciones.",
      "Elige un sistema operativo y una aplicación, y después una coincidencia exacta o una secuencia contenida. Revisa la acción, las condiciones de foco, el alcance de la documentación y la fuente de cada resultado."
    ],
    "exampleResult": "Con Windows, Visual Studio Code y coincidencia exacta seleccionados, se encuentra el atajo de dos pulsaciones para añadir comentarios de línea en el editor. Pulsa Ctrl+K y después Ctrl+C; K y C no se pulsan a la vez.",
    "limitations": [
      "La herramienta no detecta aplicaciones en ejecución ni procesos que utilizan una tecla. La ausencia de resultados en el diccionario no demuestra que un atajo no se use o esté libre de conflictos. La configuración personalizada, las versiones, el foco y las distribuciones de teclado pueden cambiar el comportamiento.",
      "Las teclas solo se capturan mientras el campo específico tiene el foco. Tab mueve el foco y Escape sale de la captura. Introduce manualmente las teclas reservadas por el sistema operativo o el navegador. Ctrl y Command son modificadores distintos."
    ],
    "exampleInput": "Ctrl+K then Ctrl+C"
  },
  "explain": {
    "introduction": "Lee la salida de PostgreSQL EXPLAIN FORMAT JSON para examinar los nodos del plan, las filas estimadas frente a las reales y los tiempos registrados. No se ejecuta SQL ni se establece conexión con ninguna base de datos.",
    "steps": [
      "Pega un EXPLAIN JSON existente. Las filas reales y los tiempos están disponibles cuando la salida original incluye datos de ANALYZE.",
      "Examina la lista de nodos, opcionalmente filtrando por tipo de nodo o nombre de relación. Compara las estimaciones con las filas reales."
    ],
    "exampleResult": "Hay un nodo Seq Scan para users. Estima 1.000 filas y registra 10 filas reales por iteración, una relación real/estimado de 0.01. El tiempo de ejecución registrado es de 0.3 ms.",
    "limitations": [
      "Hasta 512 KiB, profundidad 64, 20 sentencias y 1.000 nodos. Actual Rows y los tiempos de los nodos son medias por iteración. Los tiempos de los nodos padres incluyen a sus hijos, por lo que los tiempos de los nodos nunca se suman."
    ],
    "exampleInput": "[{\"Plan\":{\"Node Type\":\"Seq Scan\",\"Relation Name\":\"users\",\"Plan Rows\":1000,\"Actual Rows\":10,\"Actual Loops\":1,\"Actual Total Time\":0.2},\"Execution Time\":0.3}]"
  }
} satisfies Record<ToolId, ToolGuide>;
