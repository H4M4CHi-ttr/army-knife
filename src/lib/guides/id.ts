import type { ToolGuide, GuideLabels } from '../guide-schema.ts'
import type { ToolId } from '../catalog.ts'

export const guideLabelsId = {
  "usage": "Cara menggunakan",
  "example": "Contoh dan penjelasan",
  "exampleInput": "Contoh input",
  "exampleResult": "Arti hasil",
  "limitations": "Input yang didukung dan batasan",
  "languages": "Bahasa halaman",
  "allTools": "Semua alat",
  "useTool": "Gunakan alat di halaman ini",
  "javascript": "Anda dapat membaca panduan dan contoh tanpa JavaScript. Aktifkan JavaScript untuk menjalankan alat.",
  "availability": "Panduan ini tersedia baik alat diaktifkan maupun dinonaktifkan. Ruang kerja interaktif mengikuti preferensi yang disimpan di peramban ini.",
  "disabledTitle": "Alat ini dinonaktifkan",
  "disabled": "Alat ini dinonaktifkan di peramban ini. Aktifkan di Pengaturan untuk menggunakannya. Membuka panduan tidak mengubah preferensi Anda.",
  "privacy": "Input diproses di memori peramban. Input tidak dikirim ke tempat lain, disimpan, atau dimasukkan ke URL halaman. Hanya preferensi yang disimpan."
} satisfies GuideLabels

export const toolGuidesId = {
  "html-entities": {
    "introduction": "Enkode teks dengan aman sebagai referensi karakter HTML dan dekode kumpulan referensi bernama yang terdokumentasi atau referensi numerik yang valid tanpa menafsirkan markup.",
    "steps": [
      "Pilih arah serta mode escape minimal atau lengkap, lalu masukkan teks Anda.",
      "Periksa dan salin hasilnya. Dekode hanya dilakukan satu kali."
    ],
    "exampleInput": "<p title=\"Hello\">A & B 👋</p>",
    "exampleResult": "Pengodean minimal menghasilkan &lt;p title=&quot;Hello&quot;&gt;A &amp; B 👋&lt;/p&gt;. Mode lengkap mengubah karakter non-ASCII menjadi referensi numerik.",
    "limitations": [
      "Input maks. 64 KiB. Dekode referensi bernama hanya mendukung amp/lt/gt/quot/apos/nbsp/copy/reg/trade/euro/hellip/mdash/ndash/times/divide. Referensi tidak valid dan tidak dikenal tetap literal. Markup tidak pernah dijalankan."
    ]
  },
  "url-encode": {
    "introduction": "Konversi string menggunakan pengodean persen untuk komponen, formulir, atau jalur yang mempertahankan garis miring; tidak ada URL yang dikunjungi.",
    "steps": [
      "Pilih arah transformasi dan mode pengodean, lalu masukkan string.",
      "Periksa dan salin hasilnya."
    ],
    "exampleInput": "A B/日+?",
    "exampleResult": "Mode komponen mengodekan A B/日+? menjadi A%20B%2F%E6%97%A5%2B%3F; mode jalur mempertahankan garis miring.",
    "limitations": [
      "Input maks. 64 KiB. Hanya mode formulir yang memperlakukan + sebagai spasi saat dekode. Escape yang salah dan UTF-8 yang tidak valid menghasilkan kesalahan. Alat ini tidak menguraikan atau mengambil URL."
    ]
  },
  "dummy-text": {
    "introduction": "Buat teks pengisi yang dapat dihasilkan ulang dari frasa sintetis tetap dalam enam gaya bahasa.",
    "steps": [
      "Pilih bahasa, paragraf/kalimat/karakter, jumlah, dan seed.",
      "Salin atau unduh output."
    ],
    "exampleInput": "language=ja; unit=paragraphs; count=3; seed=42",
    "exampleResult": "Bahasa Jepang / 3 paragraf / seed 42 selalu menghasilkan tiga paragraf yang sama.",
    "limitations": [
      "Maksimal 30 paragraf, 120 kalimat, atau 10.000 skalar Unicode; output maksimal 64 KiB. Frasa bersifat sintetis, bukan data pribadi asli."
    ]
  },
  "css-specificity": {
    "introduction": "Bandingkan spesifisitas selektor CSS (a,b,c), dengan rincian kontribusi setiap token.",
    "steps": [
      "Masukkan satu atau beberapa selektor yang dipisahkan koma.",
      "Tinjau skor komponen dan salin laporannya."
    ],
    "exampleInput": "main#app .card:hover::before, p:where(#preview) > a",
    "exampleResult": "Selektor pertama memiliki skor (1,2,2), yang kedua (0,0,2). :where berkontribusi nol.",
    "limitations": [
      "Maksimal 4.096 karakter, 32 selektor, dan 8 tingkat penyarangan. Mendukung subset Selectors 4 yang ketat; & bersarang dan fungsi semu yang tidak didukung menghasilkan kesalahan, bukan perkiraan."
    ]
  },
  "fluid-type": {
    "introduction": "Buat clamp CSS dengan interpolasi linear dari dua titik batas viewport dan ukuran font.",
    "steps": [
      "Masukkan ukuran font dan viewport batas bawah serta atas, juga nilai dasar px per rem.",
      "Geser penggeser pratinjau, lalu salin CSS yang dihasilkan."
    ],
    "exampleInput": "minSize=16px; maxSize=24px; minViewport=320px; maxViewport=1280px; rootSize=16px",
    "exampleResult": "Contoh ini menghasilkan font-size: clamp(1rem, calc(0.833333vw + 0.833333rem), 1.5rem);",
    "limitations": [
      "Ukuran font 0.5–256 px, lebar 240–10.000 px, nilai dasar 8–32 px. Viewport harus meningkat. Koefisien CSS dibulatkan hingga enam desimal; rem sebenarnya bergantung pada ukuran font akar peramban."
    ]
  },
  "cubic-bezier": {
    "introduction": "Sesuaikan fungsi waktu CSS dengan kurva sampel dan pratinjau gerakan.",
    "steps": [
      "Ubah kontrol atau tempel input Anda. Pemrosesan tetap di dalam peramban ini.",
      "Tinjau hasilnya, lalu salin atau unduh sendiri jika diperlukan."
    ],
    "exampleInput": "x1=.25, y1=.1, x2=.25, y2=1; duration=600 ms",
    "exampleResult": "cubic-bezier(0.25, 0.1, 0.25, 1)",
    "limitations": [
      "x1/x2 harus 0–1; y1/y2 −5–5; durasi 50–20.000 ms. Kurva menggunakan sampel; pratinjau mengikuti preferensi pengurangan gerakan."
    ]
  },
  "css-gradient": {
    "introduction": "Buat gradien linear dan radial dengan titik warna yang dapat diedit.",
    "steps": [
      "Ubah kontrol atau tempel input Anda. Pemrosesan tetap di dalam peramban ini.",
      "Tinjau hasilnya, lalu salin atau unduh sendiri jika diperlukan."
    ],
    "exampleInput": "linear 90deg; #3366FF 0%, #FF8C00CC 100%",
    "exampleResult": "linear-gradient(90deg, #3366FF 0%, #FF8C00CC 100%)",
    "limitations": [
      "2–8 titik warna menggunakan HEX enam/delapan digit dan posisi 0–100%. Interpolasi peramban mengikuti CSS; tanpa jaringan."
    ]
  },
  "svg-placeholder": {
    "introduction": "Buat gambar SVG atau PNG berlabel teks yang dapat diunduh secara lokal.",
    "steps": [
      "Ubah kontrol atau tempel input Anda. Pemrosesan tetap di dalam peramban ini.",
      "Tinjau hasilnya, lalu salin atau unduh sendiri jika diperlukan."
    ],
    "exampleInput": "640×360, #2D5B8A, label='640 × 360'",
    "exampleResult": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...>…</svg> (ekspor SVG dan PNG)",
    "limitations": [
      "Dimensi 1–4096 px (maks. 4 MP); label maksimal 160 byte UTF-8. Karakter khusus SVG di-escape, tanpa skrip atau URL."
    ]
  },
  "path-batch": {
    "introduction": "Pratinjau perubahan awalan, huruf besar/kecil, penomoran, dan pemisah tanpa menyentuh berkas.",
    "steps": [
      "Ubah kontrol atau tempel input Anda. Pemrosesan tetap di dalam peramban ini.",
      "Tinjau hasilnya, lalu salin atau unduh sendiri jika diperlukan."
    ],
    "exampleInput": "src/Report.txt\nsrc/report.txt; suffix=-new",
    "exampleResult": "src/Report-new.txt / src/report-new.txt; berpotensi bentrok jika huruf besar/kecil diabaikan",
    "limitations": [
      "Maksimal 500 baris/64 KiB; nama berkas tidak pernah diubah. Deteksi benturan mengabaikan huruf besar/kecil dan bersifat perkiraan pada sistem selain Windows."
    ]
  },
  "color-palette": {
    "introduction": "Buat sampel warna analog, komplementer, atau triadik berbasis HSL.",
    "steps": [
      "Ubah kontrol atau tempel input Anda. Pemrosesan tetap di dalam peramban ini.",
      "Tinjau hasilnya, lalu salin atau unduh sendiri jika diperlukan."
    ],
    "exampleInput": "base=#3366FF, count=5, analogous",
    "exampleResult": "Lima rona HSL deterministik dan variabel CSS yang dapat disalin",
    "limitations": [
      "2–8 warna sRGB dari HEX, dengan alfa opsional. Harmoni HSL tidak menjamin kontras WCAG."
    ]
  },
  "chmod": {
    "introduction": "Periksa bit izin berkas Linux sebelum mengubah mode. Konversi nilai oktal dan kotak centang rwx, pratinjau perubahan simbolis dengan cakupan tertentu, dan bandingkan izin pembuatan berdasarkan umask.",
    "steps": [
      "Masukkan tiga atau empat digit oktal, atau pilih contoh lalu atur pemilik, grup, lainnya, dan bit khusus. Perhitungan kecil langsung diperbarui.",
      "Pratinjau ekspresi dengan kelas eksplisit seperti u+x,g-w,o=. Pilih semantik direktori jika diperlukan. Gunakan pratinjau saat ingin mengganti mode terpilih.",
      "Masukkan umask secara terpisah untuk melihat contoh umum pembuatan berkas dan direktori. Salin contoh perintah GNU/Linux hanya saat diperlukan; ganti ./path sebelum digunakan."
    ],
    "exampleInput": "mode: 0644\nsymbolic: u+x,g-w,o=\numask: 022",
    "exampleResult": "0644 adalah rw-r--r--. Pratinjau simbolisnya adalah 0740 (rwxr-----). Dengan permintaan mode pembuatan 0666/0777 dan tanpa ACL bawaan, umask 022 menghasilkan berkas 0644 dan direktori 0755.",
    "limitations": [
      "Ini adalah kalkulator 12 bit, bukan simulator akses efektif atau sistem berkas. Perintah tidak dijalankan; ACL, kepemilikan, izin direktori induk, dan opsi mount berada di luar cakupan.",
      "Input simbolis memerlukan u/g/o/a eksplisit, satu operator +, - atau = per klausa, serta rwxst. X, penyalinan izin, dan spasi di dalam ekspresi tidak didukung. Maksimal 256 byte UTF-8 dan 32 klausa; input oktal/umask maksimal 16 karakter mentah.",
      "= pada direktori mempertahankan setuid/setgid yang tidak disebutkan; u-s/g-s eksplisit menghapusnya. Operan oktal GNU lima digit yang disalin mengendalikan semua bit khusus. Contoh umask terpisah dari chmod."
    ]
  },
  "base64": {
    "introduction": "Enkode teks UTF-8 menjadi Base64 atau dekode Base64 kembali menjadi UTF-8. Konversi sepenuhnya berlangsung di peramban Anda.",
    "steps": [
      "Pilih enkode atau dekode serta alfabet standar atau aman untuk URL, lalu masukkan teks.",
      "Input pendek langsung diperbarui. Teks yang lebih panjang diproses dalam Worker setelah jeda singkat; penerapan manual tersedia.",
      "Salin atau unduh hasilnya, atau tukar kembali untuk konversi arah sebaliknya."
    ],
    "exampleInput": "こんにちは 👋",
    "exampleResult": "Pengodean standar menghasilkan 44GT44KT44Gr44Gh44GvIPCfkYs=, mengubah 20 byte UTF-8 menjadi 28 karakter Base64.",
    "limitations": [
      "Input dibatasi hingga 256 KiB. Output standar menggunakan padding =; output aman untuk URL mengganti + dan / serta menghilangkan padding.",
      "Dekode menerima teks kanonis dengan atau tanpa padding, tetapi menolak spasi, karakter tidak valid, bit tak terpakai yang bukan nol, atau UTF-8 tidak valid. Berkas biner sembarang tidak didukung.",
      "Surrogate UTF-16 tanpa pasangan ditolak, bukan diganti. Input besar menggunakan Worker yang dapat dibatalkan dengan batas waktu 5 detik. Input tidak disimpan maupun dikirim."
    ]
  },
  "data-units": {
    "introduction": "Konversi bit dan byte dengan faktor SI/IEC yang tepat, secara terpisah untuk ukuran dan laju transfer.",
    "steps": [
      "Masukkan nilai atau gunakan tombol contoh. Pilih format konversi dan konteks yang sesuai, jika ada.",
      "Periksa output dan tabel detail; gunakan Salin atau Unduh untuk mengekspor hasil yang dibuat."
    ],
    "exampleInput": "1 (MiB → B)",
    "exampleResult": "1 MiB = 1.048.576 B; 1 MiB = 8.388.608 b. MB dalam SI tidak sama dengan MiB dalam IEC.",
    "limitations": [
      "Hanya nilai desimal (maksimal 96 karakter, 24 digit pecahan). SI menggunakan 1000; IEC menggunakan 1024. Hasil bertanda ≈ dipotong setelah 24 angka desimal. Nilai negatif bersifat matematis, bukan ukuran berkas yang valid.",
      "Hanya berjalan di peramban. Data tidak pernah dikirim ke API atau disimpan dalam pengaturan, riwayat, maupun URL."
    ]
  },
  "css-units": {
    "introduction": "Bandingkan satuan panjang CSS menggunakan ukuran akar, elemen, dan viewport yang ditentukan secara eksplisit.",
    "steps": [
      "Masukkan nilai atau gunakan tombol contoh. Pilih format konversi dan konteks yang sesuai, jika ada.",
      "Periksa output dan tabel detail; gunakan Salin atau Unduh untuk mengekspor hasil yang dibuat."
    ],
    "exampleInput": "16 px; root font 16 px, element font 16 px, viewport 1440 × 900 px",
    "exampleResult": "16 px = 1 rem = 1 em; 16 px ≈ 1.111111 vw pada ukuran viewport ini.",
    "limitations": [
      "Masukkan panjang, asumsi ukuran font akar dan elemen, serta lebar/tinggi viewport, semuanya dalam px CSS. em didasarkan pada ukuran font elemen yang ditentukan. Pecahan dibulatkan hingga enam angka desimal; % dan kueri kontainer tidak dicakup.",
      "Hanya berjalan di peramban. Data tidak pernah dikirim ke API atau disimpan dalam pengaturan, riwayat, maupun URL."
    ]
  },
  "unicode-normalize": {
    "introduction": "Bandingkan titik kode NFC, NFD, NFKC, dan NFKD tanpa mengubah sumber.",
    "steps": [
      "Masukkan nilai atau gunakan tombol contoh. Pilih format konversi dan konteks yang sesuai, jika ada.",
      "Periksa output dan tabel detail; gunakan Salin atau Unduh untuk mengekspor hasil yang dibuat."
    ],
    "exampleInput": "é (e plus U+0301 COMBINING ACUTE ACCENT)",
    "exampleResult": "NFC menghasilkan é (U+00E9); NFD mempertahankan U+0065 U+0301. Bentuk kompatibilitas dapat mengubah karakter lain.",
    "limitations": [
      "Maksimal 16 KiB teks UTF-8. Tabel menampilkan pratinjau maksimal 32 titik kode per bentuk. Normalisasi kompatibilitas dapat menghapus perbedaan; surrogate UTF-16 tanpa pasangan dipertahankan oleh JavaScript.",
      "Hanya berjalan di peramban. Data tidak pernah dikirim ke API atau disimpan dalam pengaturan, riwayat, maupun URL."
    ]
  },
  "slug": {
    "introduction": "Buat slug ASCII atau Unicode yang konsisten dari baris teks dengan akhiran untuk menghindari benturan.",
    "steps": [
      "Masukkan nilai atau gunakan tombol contoh. Pilih format konversi dan konteks yang sesuai, jika ada.",
      "Periksa output dan tabel detail; gunakan Salin atau Unduh untuk mengekspor hasil yang dibuat."
    ],
    "exampleInput": "Hello World\nHello World",
    "exampleResult": "hello-world dan hello-world-2. Benturan diselesaikan di antara semua baris tidak kosong yang diberikan.",
    "limitations": [
      "Maksimal 16 KiB, 100 baris tidak kosong. Menggunakan NFKD, lalu mengubah ke huruf kecil dan mengganti pemisah. Mode ASCII menghapus tanda gabungan, tetapi tidak mentransliterasi aksara Jepang, Tionghoa, atau lainnya. Slug berulang diberi akhiran -2 / _2.",
      "Hanya berjalan di peramban. Data tidak pernah dikirim ke API atau disimpan dalam pengaturan, riwayat, maupun URL."
    ]
  },
  "unicode-escape": {
    "introduction": "Enkode dan dekode titik kode U+ dan escape Unicode JavaScript tanpa mengevaluasi kode.",
    "steps": [
      "Masukkan nilai atau gunakan tombol contoh. Pilih format konversi dan konteks yang sesuai, jika ada.",
      "Periksa output dan tabel detail; gunakan Salin atau Unduh untuk mengekspor hasil yang dibuat."
    ],
    "exampleInput": "A😀",
    "exampleResult": "Dalam mode U+, pengodean menghasilkan U+0041 U+1F600; dekode ketat mengembalikan A😀.",
    "limitations": [
      "Maksimal 16 KiB. Dekode hanya menerima token U+XXXX atau token escape JS lengkap, bukan JavaScript sembarang. Surrogate UTF-16 tunggal, escape salah format, dan nilai di luar rentang menghasilkan kesalahan.",
      "Hanya berjalan di peramban. Data tidak pernah dikirim ke API atau disimpan dalam pengaturan, riwayat, maupun URL."
    ]
  },
  "csv": {
    "introduction": "Periksa tabel sebelum mengimpornya: temukan nilai yang hilang, tipe campuran, dan tajuk berulang tanpa menulis ulang sel. Profil kolom dan pratinjau baris membantu menemukan masalah kualitas data.",
    "steps": [
      "Tempel teks CSV atau TSV, atau buka berkas UTF-8. Pilih pemisah dan tentukan apakah baris pertama berisi tajuk.",
      "Tinjau jumlah baris dan kolom, sel kosong, serta tipe yang disimpulkan. Tekan Jalankan jika penerapan otomatis dinonaktifkan."
    ],
    "exampleResult": "Dengan pemisah koma dan tajuk diaktifkan, terdapat 3 baris data dan 2 kolom. Kolom score memiliki 1 sel kosong; nilai lainnya disimpulkan sebagai bilangan bulat.",
    "limitations": [
      "Maksimal 16 MiB, 100.000 rekaman, dan 256 kolom. Tipe disimpulkan; nilai sel tetap berupa teks. Pratinjau baris dan pelacakan nilai unik memiliki batas tampilan atau pelacakan."
    ],
    "exampleInput": "name,score\nAda,98\nLinus,\nGrace,99"
  },
  "logs": {
    "introduction": "Saring log besar menjadi baris yang relevan, periksa jumlah menurut tingkat, dan temukan pesan berulang. Ini membantu mengenali sinyal yang sering muncul saat menyelidiki insiden.",
    "steps": [
      "Tempel log atau buka berkas UTF-8. Jika perlu, masukkan ekspresi reguler seperti ERROR|WARN.",
      "Periksa jumlah kecocokan, tingkat, baris berulang, dan pratinjau. Aktifkan pencocokan tanpa membedakan huruf besar/kecil jika diperlukan."
    ],
    "exampleResult": "Filter ERROR|WARN cocok dengan 3 baris. ERROR database timeout muncul dua kali dengan teks identik, dan ada 1 baris WARN.",
    "limitations": [
      "Log dan filter secara gabungan mendukung hingga 16 MiB, dengan maksimal 100.000 baris log. Filter menggunakan sintaks regex Rust tanpa lookaround atau referensi balik. Deteksi tingkat bersifat heuristik dan pratinjau yang ditampilkan dibatasi."
    ],
    "exampleInput": "INFO server ready\nERROR database timeout\nWARN retrying\nERROR database timeout"
  },
  "sets": {
    "introduction": "Bandingkan daftar berbasis baris sebagai himpunan untuk mengambil item bersama, item yang hanya ada di satu daftar, atau gabungannya. Hasil tanpa duplikat mempertahankan urutan input.",
    "steps": [
      "Masukkan satu item per baris dalam daftar A dan B. Penanda A: dan B: pada contoh ini hanya memisahkan input; jangan tempel penandanya.",
      "Pilih irisan, gabungan, atau operasi selisih. Tinjau opsi untuk baris kosong, spasi di tepi, dan pembedaan huruf besar/kecil."
    ],
    "exampleResult": "Irisannya adalah Rust. Gabungannya adalah Vue, Rust, Go dalam urutan tersebut; Vue muncul sekali meskipun berulang di A.",
    "limitations": [
      "Kedua daftar secara gabungan mendukung hingga 16 MiB dan 100.000 baris. Setiap baris lengkap merupakan satu item. Mode abaikan huruf besar/kecil menggunakan huruf kecil Unicode, bukan pelipatan huruf menyeluruh. Pratinjau menampilkan 1.000 item pertama; salinan dan unduhan mencakup semua hasil."
    ],
    "exampleInput": "A:\nVue\nRust\nVue\n\nB:\nRust\nGo"
  },
  "cidr": {
    "introduction": "Hitung rentang jaringan IPv4 dan IPv6, mask, serta jumlah alamat secara tepat dari notasi CIDR. Anda juga dapat melihat apakah alamat yang diberikan memiliki bit host aktif.",
    "steps": [
      "Masukkan alamat IP dan panjang prefiks, seperti 192.0.2.130/26.",
      "Periksa alamat jaringan, alamat terakhir, mask, dan jumlah alamat. Rentang host IPv4 yang relevan juga ditampilkan."
    ],
    "exampleResult": "Jaringannya adalah 192.0.2.128/26, alamat terakhir 192.0.2.191, dan mask 255.255.255.192. Terdapat 64 alamat; rentang host IPv4 biasa adalah .129 hingga .190.",
    "limitations": [
      "Ini hanya perhitungan rentang: tanpa kueri DNS, permintaan jaringan, atau pemindaian. Broadcast IPv4 dan jumlah host yang dapat digunakan tidak diterapkan pada IPv6."
    ],
    "exampleInput": "192.0.2.130/26"
  },
  "unicode": {
    "introduction": "Periksa string yang tampak identik tetapi tidak cocok, atau temukan karakter tak terlihat dalam kode yang ditempel. Temuan menunjukkan titik kode dan posisi, disertai visualisasi berlabel untuk karakter tersembunyi.",
    "steps": [
      "Tempel teks asli. Jika perlu, sertakan spasi biasa dan pemisah baris dalam pemeriksaan.",
      "Tinjau titik kode, baris, kolom, kategori, dan visualisasi. Pastikan apakah setiap karakter memang disengaja sebelum menghapusnya."
    ],
    "exampleResult": "Ada 1 U+200B ZERO WIDTH SPACE di antara user dan Name. String tampak seperti userName, tetapi teks aslinya mengandung satu karakter tambahan.",
    "limitations": [
      "Maksimal 512 KiB dan 1.000 temuan yang ditampilkan. Alat ini mendiagnosis teks tanpa memperbaikinya secara otomatis. Karakter penghubung dan penanda arah bisa digunakan secara sengaja dalam bahasa atau emoji."
    ],
    "exampleInput": "user​Name"
  },
  "json-diff": {
    "introduction": "Bandingkan struktur dan nilai JSON dengan mengabaikan spasi dan urutan kunci objek. Nilai yang ditambahkan, dihapus, dan diubah diidentifikasi dengan jalur JSON Pointer.",
    "steps": [
      "Masukkan JSON sebelum dan sesudah pada kedua input. Penanda A: dan B: pada contoh memisahkan input dan bukan bagian dari JSON.",
      "Tinjau setiap jenis perubahan dan jalurnya. Struktur dan nilai yang identik dilaporkan sama meskipun pemformatannya berbeda."
    ],
    "exampleResult": "/count berubah dari 1 menjadi 2, dan /tag ditambahkan dengan nilai new. Pemindahan kunci active tidak menimbulkan perbedaan karena nilainya tidak berubah.",
    "limitations": [
      "Setiap input dibatasi hingga 512 KiB dan kedalaman 64. Urutan larik berpengaruh. Kunci duplikat dan angka yang kehilangan presisi ditolak; jika batas perubahan tercapai, hasil parsial ditampilkan dengan penanda."
    ],
    "exampleInput": "A:\n{\"count\":1,\"active\":true}\n\nB:\n{\"active\":true,\"count\":2,\"tag\":\"new\"}"
  },
  "json-format": {
    "introduction": "Validasi sintaks JSON dan buat indentasi yang mudah dibaca atau output ringkas. Alat ini mengubah pemformatan dengan mempertahankan kunci dan nilai.",
    "steps": [
      "Tempel JSON atau buka berkas UTF-8.",
      "Pilih indentasi 2, 4, atau 8 spasi, atau pilih Ringkas. Tinjau output yang diformat, lalu salin atau unduh."
    ],
    "exampleResult": "Dengan indentasi 2 spasi, name, scores, dan active ditampilkan dengan pemisah baris dan indentasi. Ringkas menghapus spasi yang tidak diperlukan dengan mempertahankan urutan larik dan nilai.",
    "limitations": [
      "Maksimal 512 KiB dan kedalaman 64. Kunci duplikat dan angka yang kehilangan presisi ditolak. Komentar JSONC dan koma di akhir tidak didukung."
    ],
    "exampleInput": "{\"name\":\"Ada\",\"scores\":[98,99],\"active\":true}"
  },
  "contrast": {
    "introduction": "Hitung rasio kontras latar depan/latar belakang dan bandingkan dengan ambang WCAG 2.x. Pratinjau membantu memeriksa pasangan warna yang dipilih.",
    "steps": [
      "Masukkan warna teks dan latar belakang sebagai nilai heksadesimal 3 atau 6 digit, seperti #000000. Contoh menggunakan teks hitam di atas putih.",
      "Tinjau rasio dan hasil untuk teks biasa, teks besar, dan komponen antarmuka. Ubah atau tukar warna untuk menghitung ulang."
    ],
    "exampleResult": "Hitam dan putih memiliki rasio kontras 21:1. Ini memenuhi ambang AA dan AAA untuk teks biasa maupun besar, serta ambang untuk komponen antarmuka.",
    "limitations": [
      "Hanya warna heksadesimal sRGB tanpa transparansi. Transparansi, latar belakang gambar, dan gradien tidak dimodelkan. Pemeriksaan ini saja tidak dapat menentukan kepatuhan aksesibilitas secara keseluruhan."
    ],
    "exampleInput": "#000000\n#FFFFFF"
  },
  "har": {
    "introduction": "Baca HAR yang diekspor dari DevTools peramban untuk memeriksa status HTTP, kelompok host dan tipe media, serta permintaan lambat. Alat ini menganalisis lalu lintas yang direkam secara lokal.",
    "steps": [
      "Tempel HAR JSON atau buka berkas HAR UTF-8. Contoh ini adalah data sintetis dengan satu permintaan.",
      "Tinjau jumlah permintaan, kesalahan HTTP, byte respons yang diketahui, dan durasi. Beralih antara pengelompokan menurut host dan tipe media."
    ],
    "exampleResult": "Satu permintaan ini dihitung sebagai kesalahan HTTP 503. Durasi yang direkam adalah 250 ms, dan ukuran respons yang diketahui adalah 120 byte: headersSize ditambah bodySize.",
    "limitations": [
      "Maksimal 16 MiB dan 100.000 entri. URL yang direkam tidak pernah diakses. Ukuran dan waktu yang tidak diketahui tetap tidak diketahui. Jumlah durasi permintaan bersamaan bukan waktu pemuatan halaman."
    ],
    "exampleInput": "{\"log\":{\"version\":\"1.2\",\"entries\":[{\"request\":{\"method\":\"GET\",\"url\":\"https://example.test/api\"},\"response\":{\"status\":503,\"headersSize\":100,\"bodySize\":20,\"content\":{\"mimeType\":\"application/json\"}},\"time\":250}]}}"
  },
  "env": {
    "introduction": "Bandingkan dua konfigurasi .env berdasarkan kunci untuk menemukan nilai yang berubah, kunci yang hilang, definisi duplikat, dan baris salah format. Nilai disembunyikan dalam tabel secara bawaan.",
    "steps": [
      "Masukkan .env A dan .env B. Penanda A: dan B: pada contoh memisahkan input dan tidak perlu disertakan.",
      "Tinjau kunci yang berbeda dan diagnosis. Jika perlu, tampilkan nilai atau sertakan kunci yang tidak berubah."
    ],
    "exampleResult": "LOG_LEVEL berubah dari debug menjadi info. OLD_FLAG hanya ada di A, dan CACHE hanya ada di B. APP_NAME tidak berubah dan tidak ditampilkan dalam tampilan perubahan bawaan.",
    "limitations": [
      "Setiap input mendukung hingga 256 KiB, 10.000 baris, dan 2.000 definisi. Tidak ada ekspansi variabel atau perintah yang dijalankan; definisi valid terakhir yang digunakan. Implementasi dotenv lain mungkin berbeda. Salinan dan unduhan menyertakan nilai tersembunyi."
    ],
    "exampleInput": "A:\nAPP_NAME=demo\nLOG_LEVEL=debug\nOLD_FLAG=true\n\nB:\nAPP_NAME=demo\nLOG_LEVEL=info\nCACHE=true"
  },
  "url": {
    "introduction": "Periksa skema, host, jalur, dan fragmen URL, lalu edit entri kueri satu per satu. Editor mempertahankan kunci duplikat dan urutan entri sambil menampilkan URL hasilnya.",
    "steps": [
      "Masukkan URL absolut dengan skema dan host. Alat tidak membuka situs tujuan.",
      "Tinjau komponen, lalu edit, tambahkan, atau hapus kunci dan nilai kueri. Salin URL hasilnya saat siap."
    ],
    "exampleResult": "Host adalah example.test, jalur adalah /search, dan fragmen adalah results. tag memiliki dua entri, vue dan rust; q menjadi hello world karena + didekode sebagai spasi.",
    "limitations": [
      "Maksimal 16 KiB dan 200 entri kueri. Pengurai URL standar dapat menormalkan alamat. Pengeditan kueri mengodekan spasi sebagai + dan tanda plus literal sebagai %2B, serta mengabaikan segmen & kosong. Tidak ada permintaan yang dikirim ke URL."
    ],
    "exampleInput": "https://example.test/search?tag=vue&tag=rust&q=hello+world#results"
  },
  "shortcuts": {
    "introduction": "Cari pintasan aplikasi bawaan yang terdokumentasi dalam kamus lokal menggunakan kombinasi atau urutan tombol. Filter menurut sistem operasi, aplikasi, dan tindakan, lalu periksa konteks dan sumber setiap pintasan.",
    "steps": [
      "Ketik pintasan dalam input manual, atau fokuskan kolom perekam dan tekan pintasannya. Pisahkan kombinasi berurutan dengan then; maksimal 4 kombinasi didukung.",
      "Pilih sistem operasi dan aplikasi, lalu pencocokan persis atau pencarian urutan di dalam pintasan. Tinjau tindakan, kondisi fokus, cakupan dokumentasi, dan sumber untuk setiap hasil."
    ],
    "exampleResult": "Dengan Windows, Visual Studio Code, dan pencocokan persis dipilih, ini menemukan pintasan dua kombinasi untuk menambahkan komentar baris di editor. Tekan Ctrl+K diikuti Ctrl+C; K dan C tidak ditekan bersamaan.",
    "limitations": [
      "Alat ini tidak mendeteksi aplikasi atau proses berjalan yang menggunakan suatu tombol. Tidak adanya hasil kamus tidak membuktikan bahwa pintasan tidak digunakan atau bebas konflik. Pengaturan kustom, versi, fokus, dan tata letak papan tombol dapat mengubah perilakunya.",
      "Tombol hanya direkam saat kolom khusus memiliki fokus. Tab memindahkan fokus dan Escape meninggalkan perekaman. Masukkan tombol yang dicadangkan sistem operasi atau peramban secara manual. Ctrl dan Command merupakan tombol pengubah yang berbeda."
    ],
    "exampleInput": "Ctrl+K then Ctrl+C"
  },
  "explain": {
    "introduction": "Baca output PostgreSQL EXPLAIN FORMAT JSON untuk memeriksa simpul rencana, perkiraan dibandingkan baris aktual, dan waktu yang direkam. Tidak ada SQL yang dijalankan dan tidak ada koneksi basis data yang dibuat.",
    "steps": [
      "Tempel EXPLAIN JSON yang sudah ada. Baris aktual dan waktu tersedia jika output asli mencakup data ANALYZE.",
      "Periksa daftar simpul, dengan filter menurut tipe simpul atau nama relasi jika diperlukan. Bandingkan perkiraan dengan baris aktual."
    ],
    "exampleResult": "Ada satu simpul Seq Scan untuk users. Perkiraannya 1.000 baris, sementara yang direkam adalah 10 baris aktual per perulangan, dengan rasio aktual/perkiraan 0.01. Waktu eksekusi yang direkam adalah 0.3 ms.",
    "limitations": [
      "Maksimal 512 KiB, kedalaman 64, 20 pernyataan, dan 1.000 simpul. Actual Rows dan waktu simpul merupakan rata-rata per perulangan. Waktu simpul induk mencakup anaknya, sehingga waktu antarsimpul tidak pernah dijumlahkan."
    ],
    "exampleInput": "[{\"Plan\":{\"Node Type\":\"Seq Scan\",\"Relation Name\":\"users\",\"Plan Rows\":1000,\"Actual Rows\":10,\"Actual Loops\":1,\"Actual Total Time\":0.2},\"Execution Time\":0.3}]"
  }
} satisfies Record<ToolId, ToolGuide>
