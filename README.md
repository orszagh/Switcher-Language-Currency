# Switcher: Language & Currency v1.0.0

Responzívny jQuery plugin pre prepínanie jazykov a mien s plnou podporou accessibility.

## Funkcie

- ✅ **Jazykový prepínač** - Vždy aktívny s href linkami
- ✅ **Menový prepínač** - Konfigurovateľný UI prepínač
- ✅ **Mobilná optimalizácia** - Overlay a dotykové ovládanie
- ✅ **Accessibility** - Plná podpora ARIA a screen readerov
- ✅ **Klávesová navigácia** - Arrow keys, Enter, Escape, Home, End
- ✅ **Debug režim** - Podrobné logovanie do konzoly
- ✅ **Modal kompatibilita** - Správne správanie s modálnymi dialógmi

## Inštalácia

```html
<!-- CSS -->
<link rel="stylesheet" href="switcher-lang-currency-orso.css">

<!-- JavaScript (vyžaduje jQuery 3.0+) -->
<script src="switcher-lang-currency-orso.js"></script>
```

## Použitie

### HTML štruktúra

```html
<!-- Jazykový prepínač -->
<div class="switch lang" role="group" aria-label="Výber jazyka">
    <button class="current" aria-expanded="false" aria-haspopup="listbox">
        <span aria-hidden="true">SK</span>
        <span class="sr-only">Aktuálny jazyk: Slovenčina. Stlačte pre výber iného jazyka.</span>
    </button>
    <div class="options" role="listbox" tabindex="-1"></div>
</div>

<!-- Menový prepínač -->
<div class="switch currency" role="group" aria-label="Výber meny">
    <button class="current" aria-expanded="false" aria-haspopup="listbox">
        <span aria-hidden="true">EUR</span>
        <span class="sr-only">Aktuálna mena: Euro. Stlačte pre výber inej meny.</span>
    </button>
    <div class="options" role="listbox" tabindex="-1">
        <ul class="options-list">
            <li role="option" data-currency="eur">Euro (EUR)</li>
            <li role="option" data-currency="usd">US Dollar (USD)</li>
            <li role="option" data-currency="czk">Česká koruna (CZK)</li>
        </ul>
    </div>
</div>
```

### JavaScript inicializácia

```javascript
LCSwitcher.init({
    language: 'sk',
    languages: [
        "sk|Slovenčina",
        "cz|Čeština", 
        "en|English",
        "de|Deutsch"
    ],
    languageChangeUrl: '/Home/ChangeLanguage?code={CODE}',
    currency: 'eur',
    allowCurrencyChange: true,
    debug: false
});
```

## Možnosti konfigurácie

| Možnosť | Typ | Default | Popis |
|---------|-----|---------|-------|
| `language` | string | z `<html lang>` | Aktuálny jazyk |
| `languages` | string[] | `["cz\|Česky", "en\|English"]` | Dostupné jazyky v tvare "kod\|Label" |
| `languageChangeUrl` | string | `/Home/ChangeLanguage?code={CODE}` | URL template pre zmenu jazyka |
| `currency` | string | - | Aktuálna mena |
| `allowCurrencyChange` | boolean | `true` | Či zobraziť menový prepínač |
| `debug` | boolean | `false` | Debug výpisy do konzoly |

## API

```javascript
// Inicializácia
LCSwitcher.init(options);

// Debug režim
LCSwitcher.enableDebug();
LCSwitcher.disableDebug();

// Vyčistenie
LCSwitcher.destroy();
```

## Callback funkcie

```javascript
// Callback pre zmenu meny
window.onCurrencyChange = function(newCurrency) {
    console.log('Mena zmenená na:', newCurrency);
    // Vaša logika...
};
```

## Mobilná optimalizácia

Plugin automaticky deteguje mobilné zobrazenie (max-width: 768px) a:
- Vytvorí overlay pre lepšie UX
- Centruje dropdown na obrazovku
- Optimalizuje dotykovú interakciu
- Správne nastavuje z-index vrstvy

## Accessibility funkcie

- **ARIA** - Kompletné ARIA označovanie
- **Screen readers** - Live announcements pre zmeny
- **Klávesnica** - Plná navigácia klávesnicou
- **Focus management** - Správne riadenie fokusu

## Licencia

MIT License - viď [LICENSE](LICENSE) súbor.

## Autor

Vytvorené pre potreby moderných webových aplikácií s dôrazom na accessibility a responzívny dizajn.
