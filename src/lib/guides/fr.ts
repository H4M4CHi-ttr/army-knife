import type { ToolGuide, GuideLabels } from '../guide-schema.ts';
import type { ToolId } from '../catalog.ts';

export const guideLabelsFr = {
  "usage": "Mode d’emploi",
  "example": "Exemple et interprétation",
  "exampleInput": "Exemple d’entrée",
  "exampleResult": "Signification du résultat",
  "limitations": "Entrées prises en charge et limites",
  "languages": "Langue de la page",
  "allTools": "Tous les outils",
  "useTool": "Utiliser l’outil sur cette page",
  "javascript": "Vous pouvez lire le guide et les exemples sans JavaScript. Activez JavaScript pour utiliser l’outil.",
  "availability": "Ce guide est disponible que l’outil soit activé ou désactivé. L’espace de travail interactif respecte les préférences enregistrées dans ce navigateur.",
  "disabledTitle": "Cet outil est désactivé",
  "disabled": "Cet outil est désactivé dans ce navigateur. Activez-le dans les paramètres pour l’utiliser. L’ouverture de son guide ne modifie pas vos préférences.",
  "privacy": "Les saisies sont traitées dans la mémoire du navigateur. Elles ne sont ni transmises ailleurs, ni enregistrées, ni incluses dans l’URL de la page. Seules les préférences sont sauvegardées."
} satisfies GuideLabels;

export const toolGuidesFr = {
  "html-entities": {
    "introduction": "Encodez du texte en références de caractères HTML et décodez un ensemble documenté de références nommées ou de références numériques valides, sans interpréter le balisage.",
    "steps": [
      "Choisissez le sens et l’échappement minimal ou complet, puis saisissez votre texte.",
      "Examinez et copiez le résultat. Le décodage ne s’effectue qu’en une seule passe."
    ],
    "exampleInput": "<p title=\"Hello\">A & B 👋</p>",
    "exampleResult": "L’encodage minimal donne &lt;p title=&quot;Hello&quot;&gt;A &amp; B 👋&lt;/p&gt;. Le mode complet convertit les caractères non ASCII en références numériques.",
    "limitations": [
      "Max. 64 KiB en entrée. Le décodage nommé ne prend en charge que amp/lt/gt/quot/apos/nbsp/copy/reg/trade/euro/hellip/mdash/ndash/times/divide. Les références invalides ou inconnues restent littérales. Le balisage n’est jamais exécuté."
    ]
  },
  "url-encode": {
    "introduction": "Convertissez des chaînes par encodage en pourcentage selon les règles de composant, de formulaire ou de chemin avec conservation des barres obliques ; aucune URL n’est visitée.",
    "steps": [
      "Choisissez le sens de conversion et le mode d’encodage, puis saisissez une chaîne.",
      "Examinez et copiez le résultat."
    ],
    "exampleInput": "A B/日+?",
    "exampleResult": "Le mode composant encode A B/日+? en A%20B%2F%E6%97%A5%2B%3F ; le mode chemin conserve la barre oblique.",
    "limitations": [
      "Max. 64 KiB en entrée. Seul le mode formulaire traite + comme un espace au décodage. Les échappements incorrects et l’UTF-8 mal formé produisent une erreur. Cet outil n’analyse ni ne charge les URL."
    ]
  },
  "dummy-text": {
    "introduction": "Générez du texte de remplissage reproductible à partir de phrases synthétiques fixes dans six styles linguistiques.",
    "steps": [
      "Choisissez la langue, l’unité (paragraphes, phrases ou caractères), le nombre et la graine.",
      "Copiez ou téléchargez la sortie."
    ],
    "exampleInput": "language=ja; unit=paragraphs; count=3; seed=42",
    "exampleResult": "Japonais / 3 paragraphes / graine 42 produit toujours les trois mêmes paragraphes.",
    "limitations": [
      "Maximum 30 paragraphes, 120 phrases ou 10 000 valeurs scalaires Unicode ; sortie limitée à 64 KiB. Les phrases sont synthétiques et ne contiennent pas de données personnelles réelles."
    ]
  },
  "css-specificity": {
    "introduction": "Comparez la spécificité (a,b,c) des sélecteurs CSS avec le détail de la contribution de chaque jeton.",
    "steps": [
      "Saisissez un ou plusieurs sélecteurs séparés par des virgules.",
      "Examinez les scores des composants et copiez le rapport."
    ],
    "exampleInput": "main#app .card:hover::before, p:where(#preview) > a",
    "exampleResult": "Le premier sélecteur obtient (1,2,2), le second (0,0,2). :where contribue pour zéro.",
    "limitations": [
      "Maximum 4 096 caractères, 32 sélecteurs et 8 niveaux d’imbrication. Un sous-ensemble strict de Selectors 4 est pris en charge ; & imbriqué et les pseudo-fonctions non prises en charge produisent une erreur plutôt qu’une estimation."
    ]
  },
  "fluid-type": {
    "introduction": "Créez une expression CSS clamp par interpolation linéaire à partir de deux couples largeur de fenêtre / taille de police.",
    "steps": [
      "Saisissez les tailles de police et largeurs de fenêtre minimales et maximales, ainsi que la base en px par rem.",
      "Déplacez le curseur de l’aperçu, puis copiez le CSS généré."
    ],
    "exampleInput": "minSize=16px; maxSize=24px; minViewport=320px; maxViewport=1280px; rootSize=16px",
    "exampleResult": "L’exemple produit font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem);",
    "limitations": [
      "Tailles de police de 0,5 à 256 px, largeurs de 240 à 10 000 px, base de 8 à 32 px. Les largeurs de fenêtre doivent être croissantes. Les coefficients CSS sont arrondis à six décimales ; la valeur réelle de rem dépend de la taille de police racine du navigateur."
    ]
  },
  "cubic-bezier": {
    "introduction": "Ajustez une fonction de temporisation CSS avec une courbe échantillonnée et un aperçu animé.",
    "steps": [
      "Modifiez les réglages ou collez votre saisie. Le traitement reste dans ce navigateur.",
      "Examinez le résultat, puis copiez-le ou téléchargez-le si nécessaire."
    ],
    "exampleInput": "x1=.25, y1=.1, x2=.25, y2=1; duration=600 ms",
    "exampleResult": "cubic-bezier(0.25, 0.1, 0.25, 1)",
    "limitations": [
      "x1/x2 doivent être entre 0 et 1 ; y1/y2 entre −5 et 5 ; durée de 50 à 20 000 ms. La courbe est échantillonnée et l’aperçu respecte la réduction des animations."
    ]
  },
  "css-gradient": {
    "introduction": "Créez des dégradés linéaires et radiaux avec des arrêts de couleur modifiables.",
    "steps": [
      "Modifiez les réglages ou collez votre saisie. Le traitement reste dans ce navigateur.",
      "Examinez le résultat, puis copiez-le ou téléchargez-le si nécessaire."
    ],
    "exampleInput": "linear 90deg; #3366FF 0%, #FF8C00CC 100%",
    "exampleResult": "linear-gradient(90deg, #3366FF 0%, #FF8C00CC 100%)",
    "limitations": [
      "De 2 à 8 arrêts de couleur en HEX à six ou huit chiffres, aux positions de 0 à 100 %. L’interpolation du navigateur suit CSS ; aucun réseau."
    ]
  },
  "svg-placeholder": {
    "introduction": "Créez une image SVG ou PNG avec un libellé, téléchargeable localement.",
    "steps": [
      "Modifiez les réglages ou collez votre saisie. Le traitement reste dans ce navigateur.",
      "Examinez le résultat, puis copiez-le ou téléchargez-le si nécessaire."
    ],
    "exampleInput": "640×360, #2D5B8A, label='640 × 360'",
    "exampleResult": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...>…</svg> (export SVG et PNG)",
    "limitations": [
      "Dimensions de 1 à 4096 px (max. 4 MP) ; libellé limité à 160 octets UTF-8. Le SVG est échappé, sans scripts ni URL."
    ]
  },
  "path-batch": {
    "introduction": "Prévisualisez les modifications de préfixe, de casse, de numérotation et de séparateurs sans toucher aux fichiers.",
    "steps": [
      "Modifiez les réglages ou collez votre saisie. Le traitement reste dans ce navigateur.",
      "Examinez le résultat, puis copiez-le ou téléchargez-le si nécessaire."
    ],
    "exampleInput": "src/Report.txt\nsrc/report.txt; suffix=-new",
    "exampleResult": "src/Report-new.txt / src/report-new.txt ; collision possible si la casse est ignorée",
    "limitations": [
      "Jusqu’à 500 lignes / 64 KiB ; les fichiers ne sont jamais renommés. La détection des collisions ignore la casse et reste approximative hors Windows."
    ]
  },
  "color-palette": {
    "introduction": "Générez des couleurs analogues, complémentaires ou triadiques à partir du modèle HSL.",
    "steps": [
      "Modifiez les réglages ou collez votre saisie. Le traitement reste dans ce navigateur.",
      "Examinez le résultat, puis copiez-le ou téléchargez-le si nécessaire."
    ],
    "exampleInput": "base=#3366FF, count=5, analogous",
    "exampleResult": "Cinq teintes HSL déterministes et des variables CSS à copier",
    "limitations": [
      "De 2 à 8 couleurs sRGB en HEX, avec alpha facultatif. L’harmonie HSL ne garantit pas un contraste conforme aux WCAG."
    ]
  },
  "chmod": {
    "introduction": "Examinez les bits de permissions de fichiers Linux avant de changer un mode. Convertissez les valeurs octales et les cases rwx, prévisualisez des modifications symboliques ciblées et comparez les permissions de création sous umask.",
    "steps": [
      "Saisissez trois ou quatre chiffres octaux, ou choisissez un exemple puis ajustez les bits du propriétaire, du groupe, des autres et les bits spéciaux. Les petits calculs se mettent à jour immédiatement.",
      "Prévisualisez une expression avec catégories explicites telle que u+x,g-w,o=. Choisissez le comportement des répertoires si nécessaire. Appliquez l’aperçu volontairement pour remplacer le mode sélectionné.",
      "Saisissez umask séparément pour consulter des exemples courants de création de fichiers et de répertoires. Copiez la commande GNU/Linux d’exemple uniquement si vous souhaitez l’utiliser ; remplacez ./path avant usage."
    ],
    "exampleInput": "mode: 0644\nsymbolic: u+x,g-w,o=\numask: 022",
    "exampleResult": "0644 correspond à rw-r--r--. L’aperçu symbolique donne 0740 (rwxr-----). Avec les modes de création demandés 0666/0777 et sans ACL par défaut, umask 022 donne 0644 pour un fichier et 0755 pour un répertoire.",
    "limitations": [
      "Cet outil est un calculateur 12 bits, pas un simulateur d’accès effectif ou de système de fichiers. Les commandes ne sont pas exécutées ; les ACL, propriétaires, permissions des parents et options de montage sont hors périmètre.",
      "La saisie symbolique exige u/g/o/a explicite, un opérateur +, - ou = par clause, et rwxst. X, la copie de permissions et les espaces internes ne sont pas pris en charge. Maximum 256 octets UTF-8 et 32 clauses ; les entrées octales / umask sont limitées à 16 caractères bruts.",
      "Pour les répertoires, = préserve setuid/setgid non mentionnés ; u-s/g-s explicites les effacent. L’opérande octal GNU à cinq chiffres copié contrôle tous les bits spéciaux. Les exemples umask sont distincts de chmod."
    ]
  },
  "base64": {
    "introduction": "Encodez du texte UTF-8 en Base64 ou décodez du Base64 en UTF-8. La conversion se déroule entièrement dans votre navigateur.",
    "steps": [
      "Choisissez l’encodage ou le décodage, puis l’alphabet standard ou compatible URL, et saisissez le texte.",
      "Les saisies courtes se mettent à jour immédiatement. Les textes plus longs sont traités dans un Worker après un bref délai ; l’application manuelle est possible.",
      "Copiez ou téléchargez le résultat, ou permutez-le avec l’entrée pour effectuer la conversion inverse."
    ],
    "exampleInput": "こんにちは 👋",
    "exampleResult": "L’encodage standard produit 44GT44KT44Gr44Gh44GvIPCfkYs= et convertit 20 octets UTF-8 en 28 caractères Base64.",
    "limitations": [
      "La saisie est limitée à 256 KiB. La sortie standard utilise le remplissage = ; la sortie compatible URL remplace + et / et omet le remplissage.",
      "Le décodage accepte du texte canonique avec ou sans remplissage, mais pas les espaces, caractères invalides, bits inutilisés non nuls ni l’UTF-8 invalide. Les fichiers binaires arbitraires ne sont pas pris en charge.",
      "Les substituts UTF-16 isolés sont refusés plutôt que remplacés. Les saisies volumineuses utilisent un Worker annulable avec un délai maximal de 5 secondes. La saisie n’est ni enregistrée ni transmise."
    ]
  },
  "data-units": {
    "introduction": "Convertissez les bits et les octets avec les facteurs SI/IEC exacts, séparément pour les tailles et les débits.",
    "steps": [
      "Saisissez une valeur ou utilisez le bouton d’exemple. Choisissez le format de conversion et le contexte pertinent, le cas échéant.",
      "Examinez la sortie et le tableau de détails ; utilisez Copier ou Télécharger pour exporter le résultat généré."
    ],
    "exampleInput": "1 (MiB → B)",
    "exampleResult": "1 MiB = 1 048 576 B ; 1 MiB = 8 388 608 b. Le MB du SI diffère du MiB de l’IEC.",
    "limitations": [
      "Valeurs décimales uniquement (jusqu’à 96 caractères, 24 décimales). Le SI utilise 1000 ; l’IEC utilise 1024. Les résultats marqués ≈ sont tronqués après 24 décimales. Les valeurs négatives sont mathématiques, pas des tailles de fichiers valides.",
      "Fonctionne uniquement dans le navigateur. Les données ne sont jamais envoyées à une API ni enregistrées dans les paramètres, l’historique ou les URL."
    ]
  },
  "css-units": {
    "introduction": "Comparez les unités de longueur CSS avec des dimensions explicites pour la racine, l’élément et la fenêtre.",
    "steps": [
      "Saisissez une valeur ou utilisez le bouton d’exemple. Choisissez le format de conversion et le contexte pertinent, le cas échéant.",
      "Examinez la sortie et le tableau de détails ; utilisez Copier ou Télécharger pour exporter le résultat généré."
    ],
    "exampleInput": "16 px; root font 16 px, element font 16 px, viewport 1440 × 900 px",
    "exampleResult": "16 px = 1 rem = 1 em ; 16 px ≈ 1.111111 vw pour cette taille de fenêtre.",
    "limitations": [
      "Saisissez une longueur, les tailles de police supposées de la racine et de l’élément, ainsi que la largeur et la hauteur de la fenêtre, toutes en px CSS. em utilise la taille de police de l’élément indiquée. Les fractions sont arrondies à six décimales ; % et les requêtes de conteneur ne sont pas couverts.",
      "Fonctionne uniquement dans le navigateur. Les données ne sont jamais envoyées à une API ni enregistrées dans les paramètres, l’historique ou les URL."
    ]
  },
  "unicode-normalize": {
    "introduction": "Comparez les points de code NFC, NFD, NFKC et NFKD sans modifier la source.",
    "steps": [
      "Saisissez une valeur ou utilisez le bouton d’exemple. Choisissez le format de conversion et le contexte pertinent, le cas échéant.",
      "Examinez la sortie et le tableau de détails ; utilisez Copier ou Télécharger pour exporter le résultat généré."
    ],
    "exampleInput": "é (e plus U+0301 COMBINING ACUTE ACCENT)",
    "exampleResult": "NFC produit é (U+00E9) ; NFD conserve U+0065 U+0301. Les formes de compatibilité peuvent modifier d’autres caractères.",
    "limitations": [
      "Jusqu’à 16 KiB de texte UTF-8. Le tableau affiche au plus 32 points de code par forme. La normalisation de compatibilité peut supprimer des distinctions ; JavaScript préserve les substituts UTF-16 isolés.",
      "Fonctionne uniquement dans le navigateur. Les données ne sont jamais envoyées à une API ni enregistrées dans les paramètres, l’historique ou les URL."
    ]
  },
  "slug": {
    "introduction": "Créez des slugs ASCII ou Unicode stables à partir de lignes de texte, avec des suffixes en cas de collision.",
    "steps": [
      "Saisissez une valeur ou utilisez le bouton d’exemple. Choisissez le format de conversion et le contexte pertinent, le cas échéant.",
      "Examinez la sortie et le tableau de détails ; utilisez Copier ou Télécharger pour exporter le résultat généré."
    ],
    "exampleInput": "Hello World\nHello World",
    "exampleResult": "hello-world et hello-world-2. Les collisions sont résolues sur l’ensemble des lignes non vides fournies.",
    "limitations": [
      "Jusqu’à 16 KiB, 100 lignes non vides. Utilise NFKD, puis le passage en minuscules et le remplacement des séparateurs. Le mode ASCII supprime les marques combinatoires, mais ne translittère pas le japonais, le chinois ni les autres écritures. Les slugs répétés reçoivent des suffixes -2 / _2.",
      "Fonctionne uniquement dans le navigateur. Les données ne sont jamais envoyées à une API ni enregistrées dans les paramètres, l’historique ou les URL."
    ]
  },
  "unicode-escape": {
    "introduction": "Encodez et décodez les points de code U+ et les échappements Unicode JavaScript sans évaluer de code.",
    "steps": [
      "Saisissez une valeur ou utilisez le bouton d’exemple. Choisissez le format de conversion et le contexte pertinent, le cas échéant.",
      "Examinez la sortie et le tableau de détails ; utilisez Copier ou Télécharger pour exporter le résultat généré."
    ],
    "exampleInput": "A😀",
    "exampleResult": "En mode U+, l’encodage donne U+0041 U+1F600 ; le décodage strict restitue A😀.",
    "limitations": [
      "Jusqu’à 16 KiB. Le décodage n’accepte que les jetons U+XXXX ou les échappements JS complets, pas du JavaScript arbitraire. Les substituts UTF-16 isolés, les échappements mal formés et les valeurs hors plage produisent des erreurs.",
      "Fonctionne uniquement dans le navigateur. Les données ne sont jamais envoyées à une API ni enregistrées dans les paramètres, l’historique ou les URL."
    ]
  },
  "csv": {
    "introduction": "Vérifiez un tableau avant de l’importer : repérez les valeurs manquantes, les types mixtes et les en-têtes répétés sans réécrire les cellules. Les profils de colonnes et l’aperçu des lignes aident à localiser les problèmes de qualité des données.",
    "steps": [
      "Collez du texte CSV ou TSV, ou ouvrez un fichier UTF-8. Choisissez le délimiteur et indiquez si la première ligne contient les en-têtes.",
      "Examinez le nombre de lignes et de colonnes, les cellules vides et les types déduits. Appuyez sur Exécuter si l’application automatique est désactivée."
    ],
    "exampleResult": "Avec la virgule comme séparateur et les en-têtes activés, cet exemple contient 3 lignes de données et 2 colonnes. La colonne score comporte 1 cellule vide ; ses autres valeurs sont interprétées comme des entiers.",
    "limitations": [
      "Jusqu’à 16 MiB, 100 000 enregistrements et 256 colonnes. Les types sont déduits ; les valeurs des cellules restent du texte. L’aperçu des lignes et le suivi des valeurs distinctes ont des limites d’affichage ou de suivi."
    ],
    "exampleInput": "name,score\nAda,98\nLinus,\nGrace,99"
  },
  "logs": {
    "introduction": "Réduisez un journal volumineux aux lignes pertinentes, examinez les décomptes par niveau et repérez les messages répétés. Cela aide à identifier les signaux fréquents lors de l’analyse d’un incident.",
    "steps": [
      "Collez les journaux ou ouvrez un fichier UTF-8. Vous pouvez saisir une expression régulière telle que ERROR|WARN.",
      "Examinez les décomptes des correspondances, les niveaux, les lignes répétées et l’aperçu. Activez la recherche insensible à la casse si nécessaire."
    ],
    "exampleResult": "Le filtre ERROR|WARN correspond à 3 lignes. ERROR database timeout apparaît deux fois avec un texte identique, et il y a 1 ligne WARN.",
    "limitations": [
      "Les journaux et le filtre sont limités ensemble à 16 MiB, avec au plus 100 000 lignes de journal. Les filtres utilisent la syntaxe regex de Rust, sans assertions avant/arrière ni références arrière. La détection des niveaux est heuristique et l’aperçu affiché est limité."
    ],
    "exampleInput": "INFO server ready\nERROR database timeout\nWARN retrying\nERROR database timeout"
  },
  "sets": {
    "introduction": "Comparez des listes ligne par ligne comme des ensembles pour extraire les éléments communs, ceux présents dans une seule liste ou leur réunion. Les résultats sans doublons conservent l’ordre de saisie.",
    "steps": [
      "Saisissez un élément par ligne dans les listes A et B. Les marqueurs A: et B: de cet exemple séparent uniquement les entrées ; ne les collez pas.",
      "Choisissez l’intersection, l’union ou une opération de différence. Vérifiez les options pour les lignes vides, les espaces en début et fin et la sensibilité à la casse."
    ],
    "exampleResult": "L’intersection est Rust. L’union est Vue, Rust, Go, dans cet ordre ; Vue n’apparaît qu’une fois même s’il est répété dans A.",
    "limitations": [
      "Les deux listes sont limitées ensemble à 16 MiB et 100 000 lignes. Chaque ligne complète est un élément. Le mode insensible à la casse utilise les minuscules Unicode, sans repli de casse complet. L’aperçu montre les 1 000 premiers éléments ; la copie et le téléchargement incluent tous les résultats."
    ],
    "exampleInput": "A:\nVue\nRust\nVue\n\nB:\nRust\nGo"
  },
  "cidr": {
    "introduction": "Calculez les plages réseau IPv4 et IPv6, les masques et le nombre exact d’adresses à partir de la notation CIDR. Vous pouvez aussi voir si l’adresse fournie contient des bits d’hôte définis.",
    "steps": [
      "Saisissez une adresse IP et une longueur de préfixe, par exemple 192.0.2.130/26.",
      "Examinez l’adresse réseau, la dernière adresse, le masque et le nombre d’adresses. Les plages d’hôtes IPv4 applicables sont également affichées."
    ],
    "exampleResult": "Le réseau est 192.0.2.128/26, la dernière adresse est 192.0.2.191 et le masque est 255.255.255.192. Il contient 64 adresses ; la plage d’hôtes IPv4 habituelle va de .129 à .190.",
    "limitations": [
      "Il s’agit uniquement de calculs de plages : aucune requête DNS ou réseau, ni aucun scan. Les décomptes de diffusion et d’hôtes utilisables d’IPv4 ne sont pas appliqués à IPv6."
    ],
    "exampleInput": "192.0.2.130/26"
  },
  "unicode": {
    "introduction": "Examinez les chaînes qui semblent identiques mais ne correspondent pas, ou repérez les caractères invisibles dans du code collé. Les résultats indiquent les points de code et leurs positions, avec une visualisation légendée des caractères cachés.",
    "steps": [
      "Collez le texte original. Vous pouvez inclure les espaces ordinaires et les sauts de ligne dans l’analyse.",
      "Examinez les points de code, les lignes, les colonnes, les catégories et la visualisation. Déterminez si chaque caractère est intentionnel avant de le supprimer."
    ],
    "exampleResult": "Il y a 1 U+200B ZERO WIDTH SPACE entre user et Name. La chaîne ressemble à userName, mais l’original contient un caractère supplémentaire.",
    "limitations": [
      "Jusqu’à 512 KiB et 1 000 éléments détectés affichés. Cet outil diagnostique le texte sans le corriger automatiquement. Les caractères de liaison et les marques de direction peuvent être intentionnels dans les langues ou les emoji."
    ],
    "exampleInput": "user​Name"
  },
  "json-diff": {
    "introduction": "Comparez la structure et les valeurs JSON sans tenir compte des espaces ni de l’ordre des clés des objets. Les valeurs ajoutées, supprimées et modifiées sont repérées par des chemins JSON Pointer.",
    "steps": [
      "Saisissez le JSON avant et après dans les deux champs. Les marqueurs A: et B: de l’exemple séparent les entrées et ne font pas partie du JSON.",
      "Examinez le type et le chemin de chaque modification. Les structures et valeurs identiques sont signalées comme égales même si la mise en forme diffère."
    ],
    "exampleResult": "/count passe de 1 à 2 et /tag est ajouté avec la valeur new. Le déplacement de la clé active ne crée pas de différence, car sa valeur est inchangée.",
    "limitations": [
      "Chaque entrée est limitée à 512 KiB et à une profondeur de 64. L’ordre des tableaux compte. Les clés en double et les nombres perdant de la précision sont refusés ; atteindre la limite de modifications produit un résultat partiel signalé comme tel."
    ],
    "exampleInput": "A:\n{\"count\":1,\"active\":true}\n\nB:\n{\"active\":true,\"count\":2,\"tag\":\"new\"}"
  },
  "json-format": {
    "introduction": "Validez la syntaxe JSON et produisez une sortie lisible avec indentation ou une sortie compacte. L’outil modifie la mise en forme tout en préservant les clés et les valeurs.",
    "steps": [
      "Collez du JSON ou ouvrez un fichier UTF-8.",
      "Choisissez une indentation de 2, 4 ou 8 espaces, ou sélectionnez Compacter. Examinez la sortie formatée, puis copiez-la ou téléchargez-la."
    ],
    "exampleResult": "Avec une indentation de 2 espaces, name, scores et active sont affichés avec des sauts de ligne et une indentation. Compacter supprime les espaces inutiles en préservant l’ordre des tableaux et les valeurs.",
    "limitations": [
      "Jusqu’à 512 KiB et une profondeur de 64. Les clés en double et les nombres perdant de la précision sont refusés. Les commentaires JSONC et les virgules finales ne sont pas pris en charge."
    ],
    "exampleInput": "{\"name\":\"Ada\",\"scores\":[98,99],\"active\":true}"
  },
  "contrast": {
    "introduction": "Calculez le rapport de contraste entre le premier plan et l’arrière-plan et comparez-le aux seuils WCAG 2.x. L’aperçu permet d’examiner la paire de couleurs sélectionnée.",
    "steps": [
      "Saisissez les couleurs du texte et de l’arrière-plan en hexadécimal sur 3 ou 6 chiffres, par exemple #000000. L’exemple utilise du texte noir sur fond blanc.",
      "Examinez le rapport et les résultats pour le texte normal, le grand texte et les composants d’interface. Modifiez ou permutez les couleurs pour recalculer."
    ],
    "exampleResult": "Le noir et le blanc ont un rapport de contraste de 21:1. Il respecte les seuils AA et AAA pour le texte normal et le grand texte, ainsi que le seuil pour les composants d’interface.",
    "limitations": [
      "Couleurs sRGB hexadécimales opaques uniquement. La transparence, les images d’arrière-plan et les dégradés ne sont pas modélisés. Cette seule vérification ne suffit pas à établir une conformité globale en matière d’accessibilité."
    ],
    "exampleInput": "#000000\n#FFFFFF"
  },
  "har": {
    "introduction": "Lisez un HAR exporté depuis les DevTools du navigateur pour examiner les statuts HTTP, les regroupements par hôte ou type de média et les requêtes lentes. L’outil analyse localement le trafic enregistré.",
    "steps": [
      "Collez le JSON HAR ou ouvrez un fichier HAR en UTF-8. Cet exemple contient des données synthétiques avec une seule requête.",
      "Examinez les nombres de requêtes, les erreurs HTTP, les octets de réponse connus et les durées. Alternez entre les regroupements par hôte et par type de média."
    ],
    "exampleResult": "L’unique requête est comptée comme une erreur HTTP 503. Sa durée enregistrée est de 250 ms et sa taille de réponse connue est de 120 octets : headersSize plus bodySize.",
    "limitations": [
      "Jusqu’à 16 MiB et 100 000 entrées. Les URL enregistrées ne sont jamais appelées. Les tailles et durées inconnues restent inconnues. La somme des durées de requêtes simultanées n’est pas le temps de chargement de la page."
    ],
    "exampleInput": "{\"log\":{\"version\":\"1.2\",\"entries\":[{\"request\":{\"method\":\"GET\",\"url\":\"https://example.test/api\"},\"response\":{\"status\":503,\"headersSize\":100,\"bodySize\":20,\"content\":{\"mimeType\":\"application/json\"}},\"time\":250}]}}"
  },
  "env": {
    "introduction": "Comparez deux configurations .env par clé pour repérer les valeurs modifiées, les clés manquantes, les définitions en double et les lignes mal formées. Les valeurs sont masquées dans le tableau par défaut.",
    "steps": [
      "Saisissez .env A et .env B. Les marqueurs A: et B: de l’exemple séparent les entrées et doivent être omis.",
      "Examinez les clés différentes et les diagnostics. Vous pouvez afficher les valeurs ou inclure les clés inchangées."
    ],
    "exampleResult": "LOG_LEVEL passe de debug à info. OLD_FLAG est uniquement dans A, et CACHE uniquement dans B. APP_NAME est inchangé et n’apparaît pas dans la vue des modifications par défaut.",
    "limitations": [
      "Chaque entrée accepte jusqu’à 256 KiB, 10 000 lignes et 2 000 définitions. Aucune substitution de variable ou de commande n’est exécutée ; la dernière définition valide prévaut. D’autres implémentations de dotenv peuvent différer. La copie et le téléchargement incluent les valeurs masquées."
    ],
    "exampleInput": "A:\nAPP_NAME=demo\nLOG_LEVEL=debug\nOLD_FLAG=true\n\nB:\nAPP_NAME=demo\nLOG_LEVEL=info\nCACHE=true"
  },
  "url": {
    "introduction": "Examinez le schéma, l’hôte, le chemin et le fragment d’une URL, puis modifiez individuellement ses paramètres. L’éditeur conserve les clés en double et l’ordre des entrées tout en affichant l’URL résultante.",
    "steps": [
      "Saisissez une URL absolue contenant un schéma et un hôte. L’outil n’ouvre pas le site de destination.",
      "Examinez les composants, puis modifiez, ajoutez ou supprimez les clés et valeurs des paramètres. Copiez l’URL obtenue lorsque vous êtes prêt."
    ],
    "exampleResult": "L’hôte est example.test, le chemin est /search et le fragment est results. tag possède deux entrées, vue et rust ; q devient hello world car + se décode en espace.",
    "limitations": [
      "Jusqu’à 16 KiB et 200 paramètres. L’analyseur d’URL standard peut normaliser l’adresse. L’éditeur encode les espaces en + et les signes plus littéraux en %2B, et omet les segments & vides. Aucune requête n’est envoyée à l’URL."
    ],
    "exampleInput": "https://example.test/search?tag=vue&tag=rust&q=hello+world#results"
  },
  "shortcuts": {
    "introduction": "Recherchez les raccourcis par défaut documentés des applications dans un dictionnaire local, à partir d’une combinaison ou d’une séquence de touches. Filtrez par système, application et action, puis examinez le contexte et les sources de chaque raccourci.",
    "steps": [
      "Saisissez un raccourci dans le champ manuel, ou placez le focus dans le champ de capture et appuyez sur les touches. Séparez les frappes successives par then ; jusqu’à 4 frappes sont prises en charge.",
      "Choisissez un système et une application, puis une correspondance exacte ou une séquence contenue. Pour chaque résultat, examinez l’action, les conditions de focus, le périmètre de la documentation et la source."
    ],
    "exampleResult": "Avec Windows, Visual Studio Code et la correspondance exacte sélectionnés, cet exemple trouve le raccourci en deux frappes permettant d’ajouter des commentaires de ligne dans l’éditeur. Appuyez sur Ctrl+K puis Ctrl+C ; K et C ne sont pas enfoncés ensemble.",
    "limitations": [
      "Cet outil ne détecte pas les applications en cours d’exécution ni les processus utilisant une touche. L’absence de résultat dans le dictionnaire ne prouve pas qu’un raccourci est inutilisé ou sans conflit. Les réglages personnalisés, versions, focus et dispositions de clavier peuvent modifier le comportement.",
      "Les touches ne sont capturées que lorsque le champ dédié a le focus. Tab déplace le focus et Échap quitte la capture. Saisissez manuellement les touches réservées par le système ou le navigateur. Ctrl et Command sont des modificateurs distincts."
    ],
    "exampleInput": "Ctrl+K then Ctrl+C"
  },
  "explain": {
    "introduction": "Lisez la sortie PostgreSQL EXPLAIN FORMAT JSON pour examiner les nœuds du plan, les lignes estimées et réelles, ainsi que les durées enregistrées. Aucun SQL n’est exécuté et aucune connexion à une base de données n’est établie.",
    "steps": [
      "Collez un JSON EXPLAIN existant. Les lignes réelles et les durées sont disponibles lorsque la sortie d’origine inclut des données ANALYZE.",
      "Examinez la liste des nœuds, avec un filtre facultatif par type de nœud ou nom de relation. Comparez les estimations aux lignes réelles."
    ],
    "exampleResult": "Il y a un nœud Seq Scan pour users. Il estime 1 000 lignes et enregistre 10 lignes réelles par boucle, soit un rapport réel / estimé de 0,01. Le temps d’exécution enregistré est de 0,3 ms.",
    "limitations": [
      "Jusqu’à 512 KiB, profondeur 64, 20 instructions et 1 000 nœuds. Actual Rows et les temps des nœuds sont des moyennes par boucle. Les temps des nœuds parents incluent ceux de leurs enfants ; les temps des nœuds ne sont donc jamais additionnés."
    ],
    "exampleInput": "[{\"Plan\":{\"Node Type\":\"Seq Scan\",\"Relation Name\":\"users\",\"Plan Rows\":1000,\"Actual Rows\":10,\"Actual Loops\":1,\"Actual Total Time\":0.2},\"Execution Time\":0.3}]"
  }
} satisfies Record<ToolId, ToolGuide>;
