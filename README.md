# Miss Queen Era World — Demo Site

Müşteri sunumu için hazırlanmış, animasyonlu tek sayfa demo. Siyah & altın, "gök cisimleri" temalı lüks bir tasarım; logolar Motion Array tarzı logo reveal'larla canlandırıldı.

## Görüntüleme

- En kolayı: `index.html` dosyasını tarayıcıda açın (internet gerekmez, tüm kütüphane ve fontlar projenin içinde).
- Yerel sunucu ile: `npx serve .` ya da `python3 -m http.server` → `http://localhost:3000` / `:8000`
- Yayınlamak için: GitHub Pages (Settings → Pages → branch seçin) ya da klasörü Netlify Drop'a sürükleyin.

## Öne çıkanlar

- **Sinematik intro:** altın parçacıklar taç şeklinde toplanır → taç çizgi çizim olarak kendini çizer → radyal altın açılışı, lens flare, ışık süpürmesi, pırlanta parıltıları → wordmark → taç hero'daki yerine uçar. (Sağ altta "Introyu geç", footer'da "Logo introsunu tekrar oynat".)
- **Amblem reveal:** Hakkımızda bölümünde QEW amblemi kaydırınca çizgiyle çizilip altına dönüşür.
- **Etkileşimli taç:** tacın sembolleri için noktalar, büyüteç (loupe) ve imleci takip eden ışık.
- **Taca giden yol:** masaüstünde yatay kaydırmalı sabitlenmiş zaman çizelgesi, mobilde dikey.
- **Dünya:** sürüklenebilir, altın noktalı 3D küre; İstanbul'dan ülkelere uçan yaylar.
- TR / EN dil seçici (tarayıcı dili Türkçe ise TR açılır), tam responsive, `prefers-reduced-motion` desteği.

## Yapı

```
index.html
assets/css/style.css      tasarım sistemi + tüm stiller
assets/js/main.js         intro, scroll animasyonları, etkileşimler
assets/js/i18n.js         Türkçe metinler (İngilizce metinler index.html içinde)
assets/js/globe.js        küre (canvas)
assets/js/logo-data.js    logolardan çıkarılan vektör konturlar + parıltı noktaları (üretilmiş)
assets/js/globe-data.js   kara noktaları, Natural Earth 110m (üretilmiş)
assets/img/               şeffaf logolar, favicon, paylaşım görseli
assets/vendor/            GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13
assets/fonts/             Cinzel, Cormorant Garamond, Jost (latin + latin-ext)
```

## Demo içerik notu

Tarihler (Büyük Final 23 Ekim 2027), ülke/delege sayıları, arşiv yılları, e-posta/telefon ve form tamamen örnek içeriktir; form veri göndermez. Gerçek bilgiler gelince `index.html` (EN) ve `assets/js/i18n.js` (TR) üzerinden güncellenir.
