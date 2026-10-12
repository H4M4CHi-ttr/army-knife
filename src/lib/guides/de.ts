import type { ToolGuide, GuideLabels } from '../guide-schema.ts';
import type { ToolId } from '../catalog.ts';

export const guideLabelsDe = {
  "usage": "Anleitung",
  "example": "Beispiel und Erläuterung",
  "exampleInput": "Beispieleingabe",
  "exampleResult": "Bedeutung des Ergebnisses",
  "limitations": "Unterstützte Eingaben und Grenzen",
  "languages": "Seitensprache",
  "allTools": "Alle Werkzeuge",
  "useTool": "Werkzeug auf dieser Seite verwenden",
  "javascript": "Sie können die Anleitung und Beispiele ohne JavaScript lesen. Aktivieren Sie JavaScript, um das Werkzeug zu bedienen.",
  "availability": "Diese Anleitung ist verfügbar, unabhängig davon, ob das Werkzeug aktiviert oder deaktiviert ist. Der interaktive Arbeitsbereich berücksichtigt die in diesem Browser gespeicherten Einstellungen.",
  "disabledTitle": "Dieses Werkzeug ist deaktiviert",
  "disabled": "Dieses Werkzeug ist in diesem Browser deaktiviert. Aktivieren Sie es in den Einstellungen, um es zu verwenden. Das Öffnen der Anleitung ändert Ihre Einstellungen nicht.",
  "privacy": "Eingaben werden im Arbeitsspeicher des Browsers verarbeitet. Sie werden weder anderweitig gesendet noch gespeichert oder in die Seiten-URL aufgenommen. Nur Einstellungen werden gespeichert."
} satisfies GuideLabels;

export const toolGuidesDe = {
  "html-entities": {
    "introduction": "Kodieren Sie Text sicher als HTML-Zeichenreferenzen und dekodieren Sie eine dokumentierte Auswahl benannter oder gültiger numerischer Referenzen, ohne Markup zu interpretieren.",
    "steps": [
      "Wählen Sie die Richtung sowie minimale oder vollständige Maskierung und geben Sie Ihren Text ein.",
      "Prüfen und kopieren Sie das Ergebnis. Die Dekodierung erfolgt in genau einem Durchlauf."
    ],
    "exampleInput": "<p title=\"Hello\">A & B 👋</p>",
    "exampleResult": "Minimale Kodierung ergibt &lt;p title=&quot;Hello&quot;&gt;A &amp; B 👋&lt;/p&gt;. Der vollständige Modus wandelt Nicht-ASCII-Zeichen in numerische Referenzen um.",
    "limitations": [
      "Max. 64 KiB Eingabe. Die Dekodierung benannter Referenzen unterstützt nur amp/lt/gt/quot/apos/nbsp/copy/reg/trade/euro/hellip/mdash/ndash/times/divide. Ungültige und unbekannte Referenzen bleiben wörtlich erhalten. Markup wird niemals ausgeführt."
    ]
  },
  "url-encode": {
    "introduction": "Konvertieren Sie Zeichenfolgen per Prozentkodierung für Komponenten, Formulare oder Pfade mit erhaltenen Schrägstrichen; es wird keine URL aufgerufen.",
    "steps": [
      "Wählen Sie die Konvertierungsrichtung und den Kodierungsmodus und geben Sie eine Zeichenfolge ein.",
      "Prüfen und kopieren Sie das Ergebnis."
    ],
    "exampleInput": "A B/日+?",
    "exampleResult": "Der Komponentenmodus kodiert A B/日+? als A%20B%2F%E6%97%A5%2B%3F; der Pfadmodus behält den Schrägstrich bei.",
    "limitations": [
      "Max. 64 KiB Eingabe. Nur der Formularmodus behandelt + beim Dekodieren als Leerzeichen. Fehlerhafte Escapesequenzen und ungültiges UTF-8 führen zu Fehlern. Das Werkzeug analysiert oder lädt keine URLs."
    ]
  },
  "dummy-text": {
    "introduction": "Erzeugen Sie reproduzierbaren Blindtext aus festen synthetischen Sätzen in sechs Sprachstilen.",
    "steps": [
      "Wählen Sie Sprache, Einheit (Absätze, Sätze oder Zeichen), Anzahl und Startwert.",
      "Kopieren Sie die Ausgabe oder laden Sie sie herunter."
    ],
    "exampleInput": "language=ja; unit=paragraphs; count=3; seed=42",
    "exampleResult": "Japanisch / 3 Absätze / Startwert 42 erzeugt immer dieselben drei Absätze.",
    "limitations": [
      "Höchstens 30 Absätze, 120 Sätze oder 10.000 Unicode-Skalarwerte; maximal 64 KiB Ausgabe. Die Sätze sind synthetisch und enthalten keine echten personenbezogenen Daten."
    ]
  },
  "css-specificity": {
    "introduction": "Vergleichen Sie die CSS-Selektorspezifität (a,b,c) mit Zuordnung des Beitrags jedes Tokens.",
    "steps": [
      "Geben Sie einen oder mehrere kommagetrennte Selektoren ein.",
      "Prüfen Sie die Komponentenwerte und kopieren Sie den Bericht."
    ],
    "exampleInput": "main#app .card:hover::before, p:where(#preview) > a",
    "exampleResult": "Der erste Selektor hat den Wert (1,2,2), der zweite (0,0,2). :where trägt null bei.",
    "limitations": [
      "Höchstens 4.096 Zeichen, 32 Selektoren und 8 Verschachtelungsebenen. Unterstützt wird eine strenge Teilmenge von Selectors 4; verschachteltes & und nicht unterstützte Pseudofunktionen führen zu Fehlern statt zu Schätzungen."
    ]
  },
  "fluid-type": {
    "introduction": "Erzeugen Sie einen linear interpolierten CSS-clamp-Ausdruck aus zwei Wertepaaren für Viewportbreite und Schriftgröße.",
    "steps": [
      "Geben Sie untere und obere Schriftgrößen und Viewportbreiten sowie den Basiswert in px pro rem ein.",
      "Bewegen Sie den Vorschauregler und kopieren Sie anschließend das erzeugte CSS."
    ],
    "exampleInput": "minSize=16px; maxSize=24px; minViewport=320px; maxViewport=1280px; rootSize=16px",
    "exampleResult": "Das Beispiel erzeugt font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem);",
    "limitations": [
      "Schriftgrößen 0,5–256 px, Breiten 240–10.000 px, Basis 8–32 px. Die Viewportbreiten müssen aufsteigend sein. CSS-Koeffizienten werden auf sechs Dezimalstellen gerundet; der tatsächliche rem-Wert hängt von der Wurzelschriftgröße des Browsers ab."
    ]
  },
  "cubic-bezier": {
    "introduction": "Passen Sie eine CSS-Zeitfunktion mit einer abgetasteten Kurve und Bewegungsvorschau an.",
    "steps": [
      "Ändern Sie die Einstellungen oder fügen Sie Ihre Eingabe ein. Die Verarbeitung bleibt in diesem Browser.",
      "Prüfen Sie das Ergebnis und kopieren Sie es bei Bedarf oder laden Sie es herunter."
    ],
    "exampleInput": "x1=.25, y1=.1, x2=.25, y2=1; duration=600 ms",
    "exampleResult": "cubic-bezier(0.25, 0.1, 0.25, 1)",
    "limitations": [
      "x1/x2 müssen zwischen 0 und 1 liegen, y1/y2 zwischen −5 und 5; Dauer 50–20.000 ms. Die Kurve wird abgetastet, die Vorschau berücksichtigt reduzierte Bewegung."
    ]
  },
  "css-gradient": {
    "introduction": "Erstellen Sie lineare und radiale Verläufe mit bearbeitbaren Farbstopps.",
    "steps": [
      "Ändern Sie die Einstellungen oder fügen Sie Ihre Eingabe ein. Die Verarbeitung bleibt in diesem Browser.",
      "Prüfen Sie das Ergebnis und kopieren Sie es bei Bedarf oder laden Sie es herunter."
    ],
    "exampleInput": "linear 90deg; #3366FF 0%, #FF8C00CC 100%",
    "exampleResult": "linear-gradient(90deg, #3366FF 0%, #FF8C00CC 100%)",
    "limitations": [
      "2–8 Farbstopps mit sechs- oder achtstelligen HEX-Werten und Positionen von 0–100 %. Die Browserinterpolation folgt CSS; keine Netzwerkzugriffe."
    ]
  },
  "svg-placeholder": {
    "introduction": "Erstellen Sie ein lokal herunterladbares SVG- oder PNG-Bild mit Textbeschriftung.",
    "steps": [
      "Ändern Sie die Einstellungen oder fügen Sie Ihre Eingabe ein. Die Verarbeitung bleibt in diesem Browser.",
      "Prüfen Sie das Ergebnis und kopieren Sie es bei Bedarf oder laden Sie es herunter."
    ],
    "exampleInput": "640×360, #2D5B8A, label='640 × 360'",
    "exampleResult": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...>…</svg> (SVG- und PNG-Export)",
    "limitations": [
      "Abmessungen 1–4096 px (max. 4 MP); Beschriftung höchstens 160 UTF-8-Bytes. SVG-Inhalte werden maskiert, ohne Skripte oder URLs."
    ]
  },
  "path-batch": {
    "introduction": "Prüfen Sie Änderungen an Präfix, Groß-/Kleinschreibung, Nummerierung und Trennzeichen, ohne Dateien anzufassen.",
    "steps": [
      "Ändern Sie die Einstellungen oder fügen Sie Ihre Eingabe ein. Die Verarbeitung bleibt in diesem Browser.",
      "Prüfen Sie das Ergebnis und kopieren Sie es bei Bedarf oder laden Sie es herunter."
    ],
    "exampleInput": "src/Report.txt\nsrc/report.txt; suffix=-new",
    "exampleResult": "src/Report-new.txt / src/report-new.txt; mögliche Kollision bei ignorierter Groß-/Kleinschreibung",
    "limitations": [
      "Bis zu 500 Zeilen / 64 KiB; Dateien werden niemals umbenannt. Die Kollisionserkennung ignoriert Groß-/Kleinschreibung und ist auf anderen Systemen als Windows näherungsweise."
    ]
  },
  "color-palette": {
    "introduction": "Erzeugen Sie analoge, komplementäre oder triadische Farbfelder auf HSL-Basis.",
    "steps": [
      "Ändern Sie die Einstellungen oder fügen Sie Ihre Eingabe ein. Die Verarbeitung bleibt in diesem Browser.",
      "Prüfen Sie das Ergebnis und kopieren Sie es bei Bedarf oder laden Sie es herunter."
    ],
    "exampleInput": "base=#3366FF, count=5, analogous",
    "exampleResult": "Fünf deterministische HSL-Farbtöne und kopierbare CSS-Variablen",
    "limitations": [
      "2–8 sRGB-Farben aus HEX-Werten, optional mit Alpha. HSL-Harmonie garantiert keinen WCAG-konformen Kontrast."
    ]
  },
  "chmod": {
    "introduction": "Prüfen Sie Linux-Dateiberechtigungsbits, bevor Sie einen Modus ändern. Konvertieren Sie Oktalwerte und rwx-Kontrollkästchen, prüfen Sie gezielte symbolische Änderungen in der Vorschau und vergleichen Sie Erstellungsberechtigungen unter umask.",
    "steps": [
      "Geben Sie drei oder vier Oktalziffern ein oder wählen Sie ein Beispiel und passen Sie die Bits für Eigentümer, Gruppe, Andere und Sonderbits an. Kleine Berechnungen werden sofort aktualisiert.",
      "Prüfen Sie einen Ausdruck mit expliziten Benutzerklassen wie u+x,g-w,o= in der Vorschau. Wählen Sie bei Bedarf die Verzeichnissemantik. Übernehmen Sie die Vorschau bewusst, um den ausgewählten Modus zu ersetzen.",
      "Geben Sie umask separat ein, um typische Beispiele für die Datei- und Verzeichniserstellung zu sehen. Kopieren Sie den GNU/Linux-Beispielbefehl nur bei Bedarf; ersetzen Sie ./path vor der Verwendung."
    ],
    "exampleInput": "mode: 0644\nsymbolic: u+x,g-w,o=\numask: 022",
    "exampleResult": "0644 entspricht rw-r--r--. Die symbolische Vorschau ergibt 0740 (rwxr-----). Bei angeforderten Erstellungsmodi 0666/0777 und ohne Standard-ACL ergibt umask 022 für Dateien 0644 und für Verzeichnisse 0755.",
    "limitations": [
      "Dies ist ein 12-Bit-Rechner, kein Simulator für effektiven Zugriff oder Dateisysteme. Befehle werden nicht ausgeführt; ACLs, Eigentümer, übergeordnete Berechtigungen und Einhängeoptionen liegen außerhalb des Umfangs.",
      "Symbolische Eingaben erfordern explizites u/g/o/a, einen Operator +, - oder = pro Abschnitt und rwxst. X, das Kopieren von Berechtigungen und innerer Leerraum werden nicht unterstützt. Höchstens 256 UTF-8-Bytes und 32 Abschnitte; Oktal-/umask-Eingaben dürfen höchstens 16 rohe Zeichen enthalten.",
      "Bei Verzeichnissen erhält = nicht genannte setuid-/setgid-Bits; explizites u-s/g-s löscht sie. Der kopierte fünfstellige GNU-Oktaloperand steuert alle Sonderbits. Die umask-Beispiele sind von chmod getrennt."
    ]
  },
  "base64": {
    "introduction": "Kodieren Sie UTF-8-Text als Base64 oder dekodieren Sie Base64 zurück zu UTF-8. Die Konvertierung erfolgt vollständig in Ihrem Browser.",
    "steps": [
      "Wählen Sie Kodieren oder Dekodieren sowie das Standard- oder URL-sichere Alphabet und geben Sie Text ein.",
      "Kurze Eingaben werden sofort aktualisiert. Längere Texte werden nach einer kurzen Verzögerung in einem Worker verarbeitet; manuelles Anwenden ist möglich.",
      "Kopieren Sie das Ergebnis, laden Sie es herunter oder tauschen Sie es mit der Eingabe, um die umgekehrte Konvertierung durchzuführen."
    ],
    "exampleInput": "こんにちは 👋",
    "exampleResult": "Die Standardkodierung ergibt 44GT44KT44Gr44Gh44GvIPCfkYs= und wandelt 20 UTF-8-Bytes in 28 Base64-Zeichen um.",
    "limitations": [
      "Die Eingabe ist auf 256 KiB begrenzt. Die Standardausgabe verwendet = als Auffüllzeichen; die URL-sichere Ausgabe ersetzt + und / und lässt Auffüllzeichen weg.",
      "Die Dekodierung akzeptiert kanonischen Text mit oder ohne Auffüllzeichen, jedoch keinen Leerraum, keine ungültigen Zeichen, keine von null verschiedenen ungenutzten Bits und kein ungültiges UTF-8. Beliebige Binärdateien werden nicht unterstützt.",
      "Ungepaarte UTF-16-Surrogate werden abgelehnt statt ersetzt. Große Eingaben verwenden einen abbrechbaren Worker mit einem Zeitlimit von 5 Sekunden. Die Eingabe wird weder gespeichert noch übertragen."
    ]
  },
  "data-units": {
    "introduction": "Konvertieren Sie Bits und Bytes mit exakten SI-/IEC-Faktoren, getrennt nach Datenmengen und Übertragungsraten.",
    "steps": [
      "Geben Sie einen Wert ein oder verwenden Sie die Beispielschaltfläche. Wählen Sie das Konvertierungsformat und gegebenenfalls den passenden Kontext.",
      "Prüfen Sie die Ausgabe und die Detailtabelle; exportieren Sie das erzeugte Ergebnis mit Kopieren oder Herunterladen."
    ],
    "exampleInput": "1 (MiB → B)",
    "exampleResult": "1 MiB = 1.048.576 B; 1 MiB = 8.388.608 b. SI-MB ist nicht dasselbe wie IEC-MiB.",
    "limitations": [
      "Nur Dezimalwerte (bis zu 96 Zeichen, 24 Nachkommastellen). SI verwendet 1000, IEC 1024. Mit ≈ markierte Ergebnisse werden nach 24 Dezimalstellen abgeschnitten. Negative Werte sind mathematisch möglich, aber keine gültigen Dateigrößen.",
      "Läuft ausschließlich im Browser. Daten werden niemals an eine API gesendet oder in Einstellungen, Verlauf oder URLs gespeichert."
    ]
  },
  "css-units": {
    "introduction": "Vergleichen Sie CSS-Längeneinheiten anhand expliziter Größen für Wurzel, Element und Viewport.",
    "steps": [
      "Geben Sie einen Wert ein oder verwenden Sie die Beispielschaltfläche. Wählen Sie das Konvertierungsformat und gegebenenfalls den passenden Kontext.",
      "Prüfen Sie die Ausgabe und die Detailtabelle; exportieren Sie das erzeugte Ergebnis mit Kopieren oder Herunterladen."
    ],
    "exampleInput": "16 px; root font 16 px, element font 16 px, viewport 1440 × 900 px",
    "exampleResult": "16 px = 1 rem = 1 em; 16 px ≈ 1.111111 vw bei dieser Viewportgröße.",
    "limitations": [
      "Geben Sie eine Länge, die angenommenen Schriftgrößen von Wurzel und Element sowie Viewportbreite und -höhe in CSS-px ein. em basiert auf der angegebenen Elementschriftgröße. Brüche werden auf sechs Dezimalstellen gerundet; % und Container-Abfragen werden nicht berücksichtigt.",
      "Läuft ausschließlich im Browser. Daten werden niemals an eine API gesendet oder in Einstellungen, Verlauf oder URLs gespeichert."
    ]
  },
  "unicode-normalize": {
    "introduction": "Vergleichen Sie NFC-, NFD-, NFKC- und NFKD-Codepunkte, ohne den Ausgangstext zu verändern.",
    "steps": [
      "Geben Sie einen Wert ein oder verwenden Sie die Beispielschaltfläche. Wählen Sie das Konvertierungsformat und gegebenenfalls den passenden Kontext.",
      "Prüfen Sie die Ausgabe und die Detailtabelle; exportieren Sie das erzeugte Ergebnis mit Kopieren oder Herunterladen."
    ],
    "exampleInput": "é (e plus U+0301 COMBINING ACUTE ACCENT)",
    "exampleResult": "NFC erzeugt é (U+00E9); NFD behält U+0065 U+0301 bei. Kompatibilitätsformen können andere Zeichen verändern.",
    "limitations": [
      "Bis zu 16 KiB UTF-8-Text. Die Tabelle zeigt höchstens 32 Codepunkte pro Form. Kompatibilitätsnormalisierung kann Unterschiede entfernen; ungepaarte UTF-16-Surrogate bleiben durch JavaScript erhalten.",
      "Läuft ausschließlich im Browser. Daten werden niemals an eine API gesendet oder in Einstellungen, Verlauf oder URLs gespeichert."
    ]
  },
  "slug": {
    "introduction": "Erzeugen Sie stabile ASCII- oder Unicode-Slugs aus Textzeilen, mit Suffixen bei Kollisionen.",
    "steps": [
      "Geben Sie einen Wert ein oder verwenden Sie die Beispielschaltfläche. Wählen Sie das Konvertierungsformat und gegebenenfalls den passenden Kontext.",
      "Prüfen Sie die Ausgabe und die Detailtabelle; exportieren Sie das erzeugte Ergebnis mit Kopieren oder Herunterladen."
    ],
    "exampleInput": "Hello World\nHello World",
    "exampleResult": "hello-world und hello-world-2. Kollisionen werden über die bereitgestellten nicht leeren Zeilen hinweg aufgelöst.",
    "limitations": [
      "Bis zu 16 KiB, 100 nicht leere Zeilen. Verwendet NFKD, dann Kleinschreibung und Ersetzen von Trennzeichen. Der ASCII-Modus entfernt kombinierende Zeichen, transliteriert aber keine japanischen, chinesischen oder anderen Schriften. Wiederholte Slugs erhalten Suffixe -2 / _2.",
      "Läuft ausschließlich im Browser. Daten werden niemals an eine API gesendet oder in Einstellungen, Verlauf oder URLs gespeichert."
    ]
  },
  "unicode-escape": {
    "introduction": "Kodieren und dekodieren Sie U+-Codepunkte und JavaScript-Unicode-Escapesequenzen, ohne Code auszuwerten.",
    "steps": [
      "Geben Sie einen Wert ein oder verwenden Sie die Beispielschaltfläche. Wählen Sie das Konvertierungsformat und gegebenenfalls den passenden Kontext.",
      "Prüfen Sie die Ausgabe und die Detailtabelle; exportieren Sie das erzeugte Ergebnis mit Kopieren oder Herunterladen."
    ],
    "exampleInput": "A😀",
    "exampleResult": "Im U+-Modus ergibt die Kodierung U+0041 U+1F600; strenge Dekodierung stellt A😀 wieder her.",
    "limitations": [
      "Bis zu 16 KiB. Die Dekodierung akzeptiert nur U+XXXX-Token oder vollständige JS-Escapesequenzen, keinen beliebigen JavaScript-Code. Einzelne UTF-16-Surrogate, fehlerhafte Escapesequenzen und Werte außerhalb des Bereichs führen zu Fehlern.",
      "Läuft ausschließlich im Browser. Daten werden niemals an eine API gesendet oder in Einstellungen, Verlauf oder URLs gespeichert."
    ]
  },
  "csv": {
    "introduction": "Prüfen Sie eine Tabelle vor dem Import: Erkennen Sie fehlende Werte, gemischte Typen und wiederholte Überschriften, ohne Zellen umzuschreiben. Spaltenprofile und Zeilenvorschau helfen, Probleme der Datenqualität zu finden.",
    "steps": [
      "Fügen Sie CSV- oder TSV-Text ein oder öffnen Sie eine UTF-8-Datei. Wählen Sie das Trennzeichen und ob die erste Zeile Überschriften enthält.",
      "Prüfen Sie Zeilen- und Spaltenanzahl, leere Zellen und abgeleitete Typen. Drücken Sie Ausführen, wenn automatisches Anwenden deaktiviert ist."
    ],
    "exampleResult": "Mit Kommatrennung und aktivierten Überschriften enthält dieses Beispiel 3 Datenzeilen und 2 Spalten. Die Spalte score hat 1 leere Zelle; ihre übrigen Werte werden als Ganzzahlen erkannt.",
    "limitations": [
      "Bis zu 16 MiB, 100.000 Datensätze und 256 Spalten. Typen werden abgeleitet; Zellwerte bleiben Text. Zeilenvorschauen und die Erfassung unterschiedlicher Werte unterliegen Anzeige- oder Erfassungsgrenzen."
    ],
    "exampleInput": "name,score\nAda,98\nLinus,\nGrace,99"
  },
  "logs": {
    "introduction": "Grenzen Sie ein großes Protokoll auf relevante Zeilen ein, prüfen Sie Anzahlen pro Stufe und finden Sie wiederholte Meldungen. Das hilft, bei einer Störungsanalyse häufige Hinweise zu erkennen.",
    "steps": [
      "Fügen Sie Protokolle ein oder öffnen Sie eine UTF-8-Datei. Geben Sie bei Bedarf einen regulären Ausdruck wie ERROR|WARN ein.",
      "Prüfen Sie Trefferzahlen, Stufen, wiederholte Zeilen und die Vorschau. Aktivieren Sie bei Bedarf die Suche ohne Beachtung der Groß-/Kleinschreibung."
    ],
    "exampleResult": "Der Filter ERROR|WARN findet 3 Zeilen. ERROR database timeout erscheint zweimal mit identischem Text, hinzu kommt 1 WARN-Zeile.",
    "limitations": [
      "Protokolle und Filter unterstützen zusammen bis zu 16 MiB mit höchstens 100.000 Protokollzeilen. Filter verwenden Rust-Regex-Syntax ohne Lookarounds oder Rückreferenzen. Stufen werden heuristisch erkannt, die angezeigte Vorschau ist begrenzt."
    ],
    "exampleInput": "INFO server ready\nERROR database timeout\nWARN retrying\nERROR database timeout"
  },
  "sets": {
    "introduction": "Vergleichen Sie zeilenbasierte Listen als Mengen, um gemeinsame Einträge, Einträge nur einer Liste oder die vereinigten Inhalte zu ermitteln. Ergebnisse ohne Duplikate behalten die Eingabereihenfolge bei.",
    "steps": [
      "Geben Sie in den Listen A und B einen Eintrag pro Zeile ein. Die Markierungen A: und B: in diesem Beispiel trennen nur die Eingaben; fügen Sie die Markierungen nicht mit ein.",
      "Wählen Sie Schnittmenge, Vereinigung oder eine Differenzoperation. Prüfen Sie die Optionen für leere Zeilen, umgebenden Leerraum und Groß-/Kleinschreibung."
    ],
    "exampleResult": "Die Schnittmenge ist Rust. Die Vereinigung lautet Vue, Rust, Go in dieser Reihenfolge; Vue erscheint einmal, obwohl es in A wiederholt vorkommt.",
    "limitations": [
      "Beide Listen zusammen unterstützen bis zu 16 MiB und 100.000 Zeilen. Jede vollständige Zeile ist ein Eintrag. Der Modus ohne Groß-/Kleinschreibung verwendet Unicode-Kleinschreibung statt vollständigem Case Folding. Die Vorschau zeigt die ersten 1.000 Einträge; Kopieren und Herunterladen umfassen alle Ergebnisse."
    ],
    "exampleInput": "A:\nVue\nRust\nVue\n\nB:\nRust\nGo"
  },
  "cidr": {
    "introduction": "Berechnen Sie IPv4- und IPv6-Netzwerkbereiche, Masken und genaue Adressanzahlen aus der CIDR-Schreibweise. Sie sehen auch, ob bei der angegebenen Adresse Hostbits gesetzt sind.",
    "steps": [
      "Geben Sie eine IP-Adresse und Präfixlänge ein, beispielsweise 192.0.2.130/26.",
      "Prüfen Sie Netzwerkadresse, letzte Adresse, Maske und Adressanzahl. Zutreffende IPv4-Hostbereiche werden ebenfalls angezeigt."
    ],
    "exampleResult": "Das Netzwerk ist 192.0.2.128/26, die letzte Adresse ist 192.0.2.191 und die Maske lautet 255.255.255.192. Es enthält 64 Adressen; der übliche IPv4-Hostbereich reicht von .129 bis .190.",
    "limitations": [
      "Es werden ausschließlich Bereiche berechnet: keine DNS-Abfragen, Netzwerkanfragen oder Scans. IPv4-Broadcast- und nutzbare Hostanzahlen werden nicht auf IPv6 angewendet."
    ],
    "exampleInput": "192.0.2.130/26"
  },
  "unicode": {
    "introduction": "Untersuchen Sie Zeichenfolgen, die gleich aussehen, aber nicht übereinstimmen, oder finden Sie unsichtbare Zeichen in eingefügtem Code. Die Ergebnisse nennen Codepunkte und Positionen und stellen verborgene Zeichen mit Beschriftungen dar.",
    "steps": [
      "Fügen Sie den Originaltext ein. Beziehen Sie bei Bedarf gewöhnlichen Leerraum und Zeilenumbrüche in die Prüfung ein.",
      "Prüfen Sie Codepunkte, Zeilen, Spalten, Kategorien und die Darstellung. Entscheiden Sie vor dem Entfernen, ob das jeweilige Zeichen beabsichtigt ist."
    ],
    "exampleResult": "Zwischen user und Name befindet sich 1 U+200B ZERO WIDTH SPACE. Die Zeichenfolge ähnelt userName, enthält im Original aber ein zusätzliches Zeichen.",
    "limitations": [
      "Bis zu 512 KiB und 1.000 angezeigte Funde. Das Werkzeug diagnostiziert Text ohne automatische Korrektur. Verbindungszeichen und Richtungsmarkierungen können in Sprachen oder Emojis beabsichtigt sein."
    ],
    "exampleInput": "user​Name"
  },
  "json-diff": {
    "introduction": "Vergleichen Sie JSON-Struktur und -Werte unabhängig von Leerraum und der Reihenfolge von Objektschlüsseln. Hinzugefügte, entfernte und geänderte Werte werden durch JSON-Pointer-Pfade gekennzeichnet.",
    "steps": [
      "Geben Sie vorheriges und neues JSON in die beiden Eingabefelder ein. Die Markierungen A: und B: im Beispiel trennen die Eingaben und gehören nicht zum JSON.",
      "Prüfen Sie Typ und Pfad jeder Änderung. Identische Strukturen und Werte werden auch bei unterschiedlicher Formatierung als gleich gemeldet."
    ],
    "exampleResult": "/count ändert sich von 1 zu 2, und /tag wird mit dem Wert new hinzugefügt. Das Verschieben des Schlüssels active erzeugt keinen Unterschied, da sein Wert unverändert bleibt.",
    "limitations": [
      "Jede Eingabe ist auf 512 KiB und eine Tiefe von 64 begrenzt. Die Reihenfolge in Arrays zählt. Doppelte Schlüssel und Zahlen mit Präzisionsverlust werden abgelehnt; beim Erreichen der Änderungsgrenze wird ein gekennzeichnetes Teilergebnis ausgegeben."
    ],
    "exampleInput": "A:\n{\"count\":1,\"active\":true}\n\nB:\n{\"active\":true,\"count\":2,\"tag\":\"new\"}"
  },
  "json-format": {
    "introduction": "Validieren Sie JSON-Syntax und erzeugen Sie eine lesbar eingerückte oder kompakte Ausgabe. Das Werkzeug ändert die Formatierung und erhält Schlüssel und Werte.",
    "steps": [
      "Fügen Sie JSON ein oder öffnen Sie eine UTF-8-Datei.",
      "Wählen Sie 2, 4 oder 8 Leerzeichen zur Einrückung oder wählen Sie Minimieren. Prüfen Sie die formatierte Ausgabe und kopieren Sie sie oder laden Sie sie herunter."
    ],
    "exampleResult": "Bei einer Einrückung von 2 Leerzeichen werden name, scores und active mit Zeilenumbrüchen und Einrückungen angezeigt. Minimieren entfernt unnötigen Leerraum und erhält Array-Reihenfolge und Werte.",
    "limitations": [
      "Bis zu 512 KiB und eine Tiefe von 64. Doppelte Schlüssel und Zahlen mit Präzisionsverlust werden abgelehnt. JSONC-Kommentare und abschließende Kommas werden nicht unterstützt."
    ],
    "exampleInput": "{\"name\":\"Ada\",\"scores\":[98,99],\"active\":true}"
  },
  "contrast": {
    "introduction": "Berechnen Sie das Kontrastverhältnis zwischen Vorder- und Hintergrund und vergleichen Sie es mit den Grenzwerten von WCAG 2.x. Die Vorschau hilft bei der Beurteilung der gewählten Farbkombination.",
    "steps": [
      "Geben Sie Text- und Hintergrundfarben als drei- oder sechsstellige Hexwerte wie #000000 ein. Das Beispiel verwendet schwarzen Text auf Weiß.",
      "Prüfen Sie das Verhältnis und die Ergebnisse für normalen Text, großen Text und Bedienelemente. Ändern oder vertauschen Sie Farben, um neu zu berechnen."
    ],
    "exampleResult": "Schwarz und Weiß haben ein Kontrastverhältnis von 21:1. Es erfüllt die AA- und AAA-Grenzwerte für normalen und großen Text sowie den Grenzwert für Bedienelemente.",
    "limitations": [
      "Nur undurchsichtige sRGB-Hexfarben. Transparenz, Hintergrundbilder und Verläufe werden nicht modelliert. Diese Prüfung allein kann keine vollständige Konformität mit Anforderungen an Barrierefreiheit feststellen."
    ],
    "exampleInput": "#000000\n#FFFFFF"
  },
  "har": {
    "introduction": "Lesen Sie einen aus den Browser-DevTools exportierten HAR, um HTTP-Status, Gruppen nach Host und Medientyp sowie langsame Anfragen zu untersuchen. Das Werkzeug analysiert den aufgezeichneten Datenverkehr lokal.",
    "steps": [
      "Fügen Sie HAR-JSON ein oder öffnen Sie eine UTF-8-HAR-Datei. Dieses Beispiel enthält synthetische Daten mit einer Anfrage.",
      "Prüfen Sie Anfrageanzahlen, HTTP-Fehler, bekannte Antwortbytes und Dauern. Wechseln Sie zwischen der Gruppierung nach Host und Medientyp."
    ],
    "exampleResult": "Die einzelne Anfrage wird als HTTP-503-Fehler gezählt. Ihre aufgezeichnete Dauer beträgt 250 ms, ihre bekannte Antwortgröße 120 Bytes: headersSize plus bodySize.",
    "limitations": [
      "Bis zu 16 MiB und 100.000 Einträge. Aufgezeichnete URLs werden niemals aufgerufen. Unbekannte Größen und Zeiten bleiben unbekannt. Die Summe der Dauern gleichzeitiger Anfragen ist nicht die Seitenladezeit."
    ],
    "exampleInput": "{\"log\":{\"version\":\"1.2\",\"entries\":[{\"request\":{\"method\":\"GET\",\"url\":\"https://example.test/api\"},\"response\":{\"status\":503,\"headersSize\":100,\"bodySize\":20,\"content\":{\"mimeType\":\"application/json\"}},\"time\":250}]}}"
  },
  "env": {
    "introduction": "Vergleichen Sie zwei .env-Konfigurationen nach Schlüsseln, um geänderte Werte, fehlende Schlüssel, doppelte Definitionen und fehlerhafte Zeilen zu finden. Werte sind in der Tabelle standardmäßig verborgen.",
    "steps": [
      "Geben Sie .env A und .env B ein. Die Markierungen A: und B: im Beispiel trennen die Eingaben und müssen weggelassen werden.",
      "Prüfen Sie abweichende Schlüssel und Diagnosen. Blenden Sie bei Bedarf Werte ein oder schließen Sie unveränderte Schlüssel ein."
    ],
    "exampleResult": "LOG_LEVEL ändert sich von debug zu info. OLD_FLAG ist nur in A, CACHE nur in B vorhanden. APP_NAME ist unverändert und wird in der standardmäßigen Änderungsansicht nicht angezeigt.",
    "limitations": [
      "Jede Eingabe unterstützt bis zu 256 KiB, 10.000 Zeilen und 2.000 Definitionen. Variablen- und Befehlsexpansionen werden nicht ausgeführt; die letzte gültige Definition gilt. Andere dotenv-Implementierungen können abweichen. Kopieren und Herunterladen umfassen verborgene Werte."
    ],
    "exampleInput": "A:\nAPP_NAME=demo\nLOG_LEVEL=debug\nOLD_FLAG=true\n\nB:\nAPP_NAME=demo\nLOG_LEVEL=info\nCACHE=true"
  },
  "url": {
    "introduction": "Untersuchen Sie Schema, Host, Pfad und Fragment einer URL und bearbeiten Sie anschließend die Abfrageparameter einzeln. Der Editor erhält doppelte Schlüssel und die Reihenfolge der Einträge und zeigt die resultierende URL an.",
    "steps": [
      "Geben Sie eine absolute URL mit Schema und Host ein. Das Werkzeug öffnet die Zielwebsite nicht.",
      "Prüfen Sie die Bestandteile und bearbeiten, ergänzen oder entfernen Sie Parameterschlüssel und -werte. Kopieren Sie die fertige URL."
    ],
    "exampleResult": "Der Host ist example.test, der Pfad /search und das Fragment results. tag hat zwei Einträge, vue und rust; q wird zu hello world, da + als Leerzeichen dekodiert wird.",
    "limitations": [
      "Bis zu 16 KiB und 200 Abfrageparameter. Der Standard-URL-Parser kann die Adresse normalisieren. Die Parameterbearbeitung kodiert Leerzeichen als + und wörtliche Pluszeichen als %2B und lässt leere &-Segmente aus. Es werden keine Anfragen an die URL gesendet."
    ],
    "exampleInput": "https://example.test/search?tag=vue&tag=rust&q=hello+world#results"
  },
  "shortcuts": {
    "introduction": "Suchen Sie dokumentierte Standardtastenkürzel von Apps anhand einer Tastenkombination oder Folge in einem lokalen Verzeichnis. Filtern Sie nach Betriebssystem, App und Aktion und prüfen Sie Kontext und Quellen jeder Belegung.",
    "steps": [
      "Geben Sie ein Tastenkürzel manuell ein oder fokussieren Sie das Erfassungsfeld und drücken Sie die Tasten. Trennen Sie aufeinanderfolgende Tastenkombinationen durch then; bis zu 4 Kombinationen werden unterstützt.",
      "Wählen Sie Betriebssystem und App, dann exakte Übereinstimmung oder enthaltene Folge. Prüfen Sie bei jedem Ergebnis Aktion, Fokusbedingungen, Geltungsbereich der Dokumentation und Quelle."
    ],
    "exampleResult": "Mit Windows, Visual Studio Code und exaktem Abgleich findet dieses Beispiel die Belegung aus zwei Tastenkombinationen zum Hinzufügen von Zeilenkommentaren im Editor. Drücken Sie Ctrl+K und danach Ctrl+C; K und C werden nicht gleichzeitig gedrückt.",
    "limitations": [
      "Dieses Werkzeug erkennt keine laufenden Apps oder Prozesse, die eine Taste verwenden. Fehlende Verzeichnistreffer belegen nicht, dass ein Tastenkürzel unbenutzt oder konfliktfrei ist. Eigene Einstellungen, Versionen, Fokus und Tastaturlayouts können das Verhalten verändern.",
      "Tasten werden nur erfasst, solange das dafür vorgesehene Feld den Fokus hat. Tab verschiebt den Fokus und Escape beendet die Erfassung. Geben Sie vom Betriebssystem oder Browser reservierte Tasten manuell ein. Ctrl und Command sind unterschiedliche Modifikatoren."
    ],
    "exampleInput": "Ctrl+K then Ctrl+C"
  },
  "explain": {
    "introduction": "Lesen Sie die Ausgabe von PostgreSQL EXPLAIN FORMAT JSON, um Planknoten, geschätzte und tatsächliche Zeilen sowie aufgezeichnete Zeiten zu untersuchen. Es wird kein SQL ausgeführt und keine Datenbankverbindung hergestellt.",
    "steps": [
      "Fügen Sie vorhandenes EXPLAIN-JSON ein. Tatsächliche Zeilen und Zeiten sind verfügbar, wenn die ursprüngliche Ausgabe ANALYZE-Daten enthält.",
      "Prüfen Sie die Knotenliste und filtern Sie bei Bedarf nach Knotentyp oder Relationsname. Vergleichen Sie die Schätzungen mit den tatsächlichen Zeilen."
    ],
    "exampleResult": "Es gibt einen Seq-Scan-Knoten für users. Er schätzt 1.000 Zeilen und zeichnet 10 tatsächliche Zeilen pro Durchlauf auf; das Verhältnis tatsächlich/geschätzt beträgt 0,01. Die aufgezeichnete Ausführungszeit beträgt 0,3 ms.",
    "limitations": [
      "Bis zu 512 KiB, Tiefe 64, 20 Anweisungen und 1.000 Knoten. Actual Rows und Knotenzeiten sind Durchschnittswerte pro Durchlauf. Zeiten übergeordneter Knoten enthalten die Kindknoten, daher werden Knotenzeiten niemals addiert."
    ],
    "exampleInput": "[{\"Plan\":{\"Node Type\":\"Seq Scan\",\"Relation Name\":\"users\",\"Plan Rows\":1000,\"Actual Rows\":10,\"Actual Loops\":1,\"Actual Total Time\":0.2},\"Execution Time\":0.3}]"
  }
} satisfies Record<ToolId, ToolGuide>;
