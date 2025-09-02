# Publikovanie na GitHub

Tento súbor obsahuje pokyny pre publikovanie projektu na GitHub.

## Pred publikovaním

1. **Skontroluj všetky súbory**
   - Uisti sa, že všetky súbory sú pripravené
   - Skontroluj funkčnosť na testovacích súboroch
   - Overia správnosť všetkých odkazov v dokumentácii

2. **Aktualizuj verziu**
   - Uprav verziu v `package.json`
   - Pridaj záznam do `CHANGELOG.md`
   - Skontroluj dokumentáciu v `README.md`

## Kroky publikovania

1. **Inicializuj Git repozitár**
   ```bash
   git init
   git add .
   git commit -m "Prvé vydanie: Jazykový a menový prepínač v1.0.0"
   ```

2. **Vytvor GitHub repozitár**
   - Choď na GitHub.com
   - Vytvor nový repozitár s názvom `jazykovy-menovy-prepinac`
   - Nepridávaj README, .gitignore ani licenciu (už existujú)

3. **Pripoj lokálny repozitár k GitHub**
   ```bash
   git remote add origin https://github.com/[username]/jazykovy-menovy-prepinac.git
   git branch -M main
   git push -u origin main
   ```

4. **Vytvor release**
   - Choď na GitHub repozitár
   - Klikni na "Releases" > "Create a new release"
   - Tag: `v1.0.0`
   - Título: `Prvé vydanie v1.0.0`
   - Popis: Skopíruj zo sekcie [1.0.0] z CHANGELOG.md

## Súbory na publikovanie

### Hlavné súbory
- `switcher-lang-currency-orso.js` - Hlavný plugin
- `switcher-lang-currency-orso.scss` - SCSS štýly
- `switcher-lang-currency-orso.css` - Kompilované CSS

### Dokumentácia
- `README.md` - Hlavná dokumentácia
- `CHANGELOG.md` - História zmien
- `LICENSE` - MIT licencia
- `package.json` - NPM metadata

### Testovacie súbory
- `test-debug.html` - Test s debug režimom
- `test-mobile.html` - Test mobilného zobrazenia
- `test-modal.html` - Test kompatibility s modálmi
- `test-new-version.html` - Test novej verzie

### Distribučné súbory
- `dist/` - Produkčné súbory
- `src/` - Zdrojové súbory
- `examples/` - Príklady použitia

## Po publikovaní

1. **Otestuj inštaláciu**
   - Klonuj repozitár na iné miesto
   - Otestuj všetky príklady
   - Overia odkazy v dokumentácii

2. **Zdieľaj projekt**
   - Pridaj link do portfólia
   - Zdieľaj v komunite
   - Aktualizuj LinkedIn profil

## Licencia

Projekt je publikovaný pod MIT licenciou - viď [LICENSE](LICENSE) súbor.
