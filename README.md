# Language & Currency Switcher v1.0.0

**Kompletný, plne funkčný dropdown switcher pre jazyky a meny s podporou vlajok, labelov a responzívneho dizajnu.**

## 🎯 **Funkčnosti**

### ✅ **Základné**
- **Language Switcher**: Dropdown s jazykovými možnosťami + odkazy
- **Currency Switcher**: Dropdown pre zmenu meny s callback-om
- **Vlajky**: Automatické SVG vlajky pre všetky jazyky
- **Responzívny dizajn**: Mobilné overlay na menších obrazovkách
- **Accessibility**: Plná podpora screen reader-ov (ARIA)

### ✅ **Pokročilé**
- **Labely**: Voliteľné "Language:" a "Currency:" texty
- **Automatic Detection**: Načíta jazyk z `<html lang>` atribútu
- **CSS Custom Properties**: 67 premenných pre kompletné prispôsobenie
- **Event Management**: Inteligentné namespace-y, žiadne konflikty
- **Debug Mode**: Detailné logovanie pre diagnostiku

## 🚀 **Základné použitie**

### HTML Štruktúra
```html
<!-- Jazykový switcher -->
<div class="switch lang">
    <span class="current" role="button" tabindex="0" aria-expanded="false">
        <!-- Automaticky vygenerované -->
    </span>
    <div class="options" role="listbox">
        <!-- Automaticky vygenerované -->
    </div>
</div>

<!-- Currency switcher -->
<div class="switch currency">
    <span class="current" role="button" tabindex="0" aria-expanded="false">
        <!-- Automaticky vygenerované -->
    </span>
    <div class="options" role="listbox">
        <li role="option" data-currency="eur" aria-selected="true" class="selected">
            <span>EUR - Euro</span>
        </li>
        <li role="option" data-currency="usd" aria-selected="false">
            <span>USD - Dollar</span>
        </li>
    </div>
</div>
```

### CSS a JS Include
```html
<link rel="stylesheet" href="switcher-lang-currency-orso.css">
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="switcher-lang-currency-orso.js"></script>
```

### Základná inicializácia
```javascript
LCSwitcher.init({
    language: 'sk',
    languages: [
        "sk|Slovenčina",
        "en|English", 
        "de|Deutsch"
    ],
    currency: 'EUR',
    languageChangeUrl: '/Home/ChangeLanguage?code={CODE}'
});
```

## ⚙️ **Všetky možnosti inicializácie**

```javascript
LCSwitcher.init({
    // === JAZYKOVÉ NASTAVENIA ===
    language: 'sk',                    // Aktuálny jazyk (fallback: <html lang>)
    languages: [                       // Dostupné jazyky vo formáte "kod|Label"
        "sk|Slovenčina",
        "en|English",
        "de|Deutsch",
        "fr|Français"
    ],
    languageChangeUrl: '/api/lang/{CODE}',  // URL template s {CODE} placeholder
    languageLabel: 'Language:',        // Text pred jazyk (voliteľné)
    
    // === MENOVÉ NASTAVENIA ===
    currency: 'EUR',                   // Aktuálna mena
    currencyLabel: 'Currency:',        // Text pred menu (voliteľné)
    allowCurrencyChange: true,         // true=zobraz switcher, false=skry
    
    // === OSTATNÉ ===
    debug: false                       // true=výpisy do konzoly
});
```

## 🎨 **CSS Prispôsobenie**

Plugin používa **67 CSS custom properties** s prefixom `--tp-lang-switcher-`:

### Hlavné farby
```css
:root {
    --tp-lang-switcher-primary-color: #3498DB;
    --tp-lang-switcher-text-color: #313436;
    --tp-lang-switcher-bg-color: #ffffff;
    --tp-lang-switcher-border-color: #E1E4E6;
}
```

### Rozměry a spacing
```css
:root {
    --tp-lang-switcher-switch-height: 42px;
    --tp-lang-switcher-border-radius: 3px;
    --tp-lang-switcher-font-size: 1rem;
}
```

### Vlajky
```css
:root {
    --tp-lang-switcher-flag-size: 20px;
    --tp-lang-switcher-flag-path: '/Content/flags/4x3/';
}
```

## 📱 **Mobilné zobrazenie**

- **Automatický breakpoint**: 768px
- **Overlay background**: Tmavý overlay cez celú stránku
- **Fixed positioning**: `.lc-switches` container v ľavom dolnom rohu
- **Touch-friendly**: Väčšie touch targety

```css
/* Mobilné pozíciovanie */
--tp-lang-switcher-mobile-switches-bottom: 20px;
--tp-lang-switcher-mobile-switches-left: 20px;
```

## 🔧 **API Metódy**

```javascript
// Inicializácia
LCSwitcher.init(options);

// Debug režim
LCSwitcher.enableDebug();
LCSwitcher.disableDebug();

// Cleanup
LCSwitcher.destroy();
```

## 🏳️ **Podporované vlajky**

Plugin automaticky mapuje jazykové kódy na vlajky:

| Jazyk | Kód | Vlajka |
|-------|-----|--------|
| Slovenčina | `sk` | `sk.svg` |
| Čeština | `cz` | `cz.svg` |
| Angličtina | `en` | `gb.svg` |
| Nemčina | `de` | `de.svg` |
| Francúzština | `fr` | `fr.svg` |
| Španielčina | `es` | `es.svg` |
| Taliančina | `it` | `it.svg` |
| Ruština | `ru` | `ru.svg` |
| Poľština | `pl` | `pl.svg` |
| Maďarčina | `hu` | `hu.svg` |
| Holandčina | `nl` | `nl.svg` |
| Portugalčina | `pt` | `pt.svg` |

**Cesta k vlajkám**: `/Content/flags/4x3/[kod].svg`

## 📞 **Callback funkcie**

### Currency Change Callback
```javascript
window.onCurrencyChange = function(newCurrency) {
    console.log('Mena zmenená na:', newCurrency);
    // Tvoja vlastná logika
};
```

## 🔍 **Debug Mode**

```javascript
LCSwitcher.init({
    debug: true  // Zapne detailné logovanie
});
```

**Debug výpisy obsahujú**:
- Inicializáciu switcherov
- Click eventy a njihovie handling
- Dropdown otvorenie/zatvorenie
- Currency zmeny
- Mobile overlay správanie

## 📂 **Štruktúra súborov**

```
switcher-lang-currency-orso/
├── switcher-lang-currency-orso.js      # Hlavný JS súbor
├── switcher-lang-currency-orso.scss    # Source SCSS
├── switcher-lang-currency-orso.css     # Kompilovaný CSS
└── README.md                           # Táto dokumentácia
```

## 🛠️ **Development**

### Kompilácia SCSS
```bash
npx node-sass switcher-lang-currency-orso.scss switcher-lang-currency-orso.css --output-style expanded
```

### Požiadavky
- **jQuery 3.0+**
- **SVG vlajky** v `/Content/flags/4x3/`
- **Modern browser** s CSS custom properties

## 🐛 **Troubleshooting**

### Dropdown sa okamžite zatvára
✅ **Vyriešené** - plugin používa inteligentné event handling s delay a unique namespace-mi

### Vlajky sa nezobrazujú  
- Skontroluj cestu `--tp-lang-switcher-flag-path`
- Overy existenciu SVG súborov
- Skontroluj CSS kompiláciu

### Nesprávny aktuálny jazyk
- Nastav `<html lang="kod">` atribút
- Alebo explicitne zadaj `language: 'kod'` v options

## 📈 **Verzia History**

### v1.0.0 (September 2025)
- ✅ Kompletný language/currency switcher
- ✅ SVG vlajky s automatickým mapovaním
- ✅ Responzívny mobilný dizajn
- ✅ CSS custom properties systém (67 premenných)
- ✅ Accessibility (ARIA, screen readers)
- ✅ Event management s namespace-mi
- ✅ Debug mode
- ✅ Voliteľné labely pre text

---

**Autor**: Vyvinuté pre tp2015 projekt  
**Licence**: Interné použitie  
**Podpora**: Funkčné na jQuery 3.0+, moderné prehliadače
