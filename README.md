# Miss Queen Era World — Demo Site (v2)

Müşteri sunumu için hazırlanmış, çok sayfalı ve animasyonlu demo. miss-eurasia.com'un **"harita üzerinde yıllar ve bölümler"** konsepti korunup baştan modernleştirildi: siyah & altın, gök cisimleri temalı, Motion Array tarzı logo animasyonları.

## Görüntüleme

- `index.html` dosyasını tarayıcıda açın (internet gerekmez; kütüphaneler ve fontlar projenin içinde).
- Yerel sunucu ile: `npx serve .` ya da `python3 -m http.server`
- Yayınlamak için: GitHub Pages (Settings → Pages → branch seçin) ya da klasörü Netlify Drop'a sürükleyin.

## Sayfalar

| Sayfa | Dosya |
|---|---|
| Era Haritası (ana sayfa) | `index.html` |
| Genel Bilgi | `genel-bilgi.html` |
| Sezonlar 2018–2026 + 2027 (yakında) | `sezon/2018.html` … `sezon/2027.html` |
| Video | `video.html` |
| Basında Biz | `basin.html` |
| İyi Niyet Elçiliği | `iyi-niyet.html` |
| Başvuru (+ SSS) | `basvuru.html` |
| Mrs. / Teen alt markaları | `mrs.html`, `teen.html` |
| İletişim (+ sponsorluk) | `iletisim.html` |

## Öne çıkanlar

- **Era Haritası:** altın noktalı Avrasya haritası üzerinde organik hücrelerden oluşan bir mozaik (ağırlıklı Voronoi). Her hücre bir sezon ya da bölüm; güncel sezon altın renkte. İmlecin yakınındaki kenarlar parlıyor, hücrelerin çevresinde ışık dolaşıyor.
- **Sinematik intro:** parçacıklar taç şeklinde toplanıyor → taç çizgi olarak kendini çiziyor → altın açılış, parlama, ışık süpürmesi → taç haritanın merkezine uçuyor ve hücreler etrafında birleşiyor. Intro oturum başına bir kez oynuyor; haritanın altındaki "Logo introsunu tekrar oynat" ile yeniden izlenebiliyor.
- **Sayfa geçişleri:** tıklanan hücre kendi şeklinden büyüyerek ekranı kaplıyor, yeni sayfa örtünün yukarı kaymasıyla açılıyor.
- **Sezon sayfaları:** büyük yıl başlığı (altınla doluyor), yapışkan sekmeler, kraliçe ve prensesler, özel ödüller, yarışmacılar, galeri (lightbox) ve resmî film alanı, önceki/sonraki sezon gezinmesi.
- TR / EN dil seçici (tarayıcı dili Türkçe ise TR açılıyor), tam responsive, `prefers-reduced-motion` desteği.

## Düzenleme

Sayfalar ortak header/menü/footer ile `tools/build.mjs` tarafından üretilir. HTML'i doğrudan değil, kaynağı düzenleyip yeniden üretin:

```bash
node tools/build.mjs
```

- İngilizce metinler: `tools/build.mjs` ve `tools/src/*.html`
- Türkçe metinler: `assets/js/i18n.js` (aynı anahtarlarla)
- Haritadaki hücreler (yıllar, bölümler, sıralama): `assets/js/hub.js` içindeki `CELLS`

```
assets/js/core.js     ortak çalışma zamanı: dil, smooth scroll, sayfa geçişleri, header/menü, formlar, efektler
assets/js/intro.js    logo intro animasyonu
assets/js/hub.js      Era Haritası (mozaik + nokta harita)
assets/js/pages.js    iç sayfalar: Genel Bilgi bölümleri, galeri/video modalı, filtreler, SSS
assets/js/globe.js    Genel Bilgi'deki 3D küre
assets/css/style.css  tasarım sistemi + tüm stiller
```

## Demo içerik notu

İsimler (“Ad Soyad”), fotoğraflar (sahne ışığı yer tutucuları), ülke/delege sayıları, sezon yılları, basın başlıkları, tarihler (Büyük Final 23 Ekim 2027), e-posta/telefon ve formlar örnek içeriktir; formlar veri göndermez. Gerçek içerik gelince yukarıdaki kaynak dosyalardan güncellenir; fotoğraflar `.ph` yer tutucularının yerine `<img>` olarak eklenir.
