/* 
 * Prepínač jazykov a mien (server-driven, accessibility-first)
 * =============================================================
 * 
 * KOMPLETNÁ SADA FUNKCIÍ (pre kontinuitu AI):
 * - Prepínanie jazykov: Vždy viditeľné s <a href> navigačnými odkazmi
 * - Prepínanie mien: Iba UI s konfigurovateľným zobrazením
 * - Integrácia vlajok: SVG vlajky z ~/Content/flags/4x3/*.svg
 * - Mobilná optimalizácia: Fixné pozíciovanie vľavo dole s overlay
 * - CSS custom properties: 67 premenných s prefixom --tp-lang-switcher-
 * - Podpora labelov: Voliteľné textové prefixy pre jazyk aj menu
 * - Accessibility: Plná ARIA podpora, oznámenia pre screen readery
 * - Správa eventov: Natívny addEventListener s proper cleanup
 * 
 * POŽIADAVKY NA HTML ŠTRUKTÚRU:
 * ```html
 * <div class="switch lang">
 *   <button class="current" role="combobox" aria-expanded="false" aria-haspopup="listbox">
 *     <!-- Generované: vlajka + text + sr-only + šípka -->
 *   </button>
 *   <ul class="options" role="listbox">
 *     <!-- Generované jazykové možnosti s vlajkami -->
 *   </ul>
 * </div>
 * ```
 * 
 * ZÁVISLOSTI:
 * - jQuery 3.0+
 * - switcher-lang-currency-orso.css (skompilované z SCSS)
 * - SVG súbory vlajok v adresári ~/Content/flags/4x3/
 * 
 * INICIALIZÁCIA:
 * ```javascript
 * LCSwitcher.init({
 *   language: 'sk',           // Kód aktuálneho jazyka
 *   currency: 'eur',          // Kód aktuálnej meny  
 *   languages: ['sk|Slovenčina', 'en|English'], // Dostupné jazyky
 *   languageLabel: 'Jazyk:',  // Voliteľný textový prefix
 *   currencyLabel: 'Mena:',   // Voliteľný textový prefix
 *   allowCurrencyChange: true, // Zobraziť/skryť menový prepínač
 *   languageChangeUrl: '/Home/ChangeLanguage?code={CODE}',
 *   debug: false              // Logovania do konzoly
 * });
 * ```
 */

(function ($, window, document) {
    'use strict';

    // Debug flag - nastavuje sa cez options.debug
    let DEBUG = false;

    function log() {
        if (DEBUG && console && console.log) {
            console.log.apply(console, ['LCSwitcher:'].concat(Array.prototype.slice.call(arguments)));
        }
    }

    /* ===============================
     * POMOCNÉ FUNKCIE
     * =============================== */
    
    /**
     * Získa kód jazyka z HTML document elementu
     * Fallback na prázdny reťazec ak sa nenájde
     * @returns {string} Kód jazyka (napr. 'sk', 'en')
     */
    function getHtmlLang() {
        const lang = (document.documentElement.lang || '').trim();
        return lang ? lang.toLowerCase().split('-')[0] : '';
    }

    /**
     * Maps language codes to flag country codes
     * Handles special cases like 'en' -> 'gb'
     * @param {string} langCode - Language code (e.g., 'en', 'sk')
     * @returns {string} Flag country code for CSS class
     */
    /**
     * Mapuje kódy jazykov na kódy krajín pre vlajky
     * Riešenie špeciálnych prípadov ako 'en' -> 'gb'
     * @param {string} langCode - Kód jazyka (napr. 'en', 'sk')
     * @returns {string} Kód krajiny pre CSS triedu vlajky
     */
    function getFlagCode(langCode) {
        // Mapovanie jazykových kódov na vlajky
        const flagMapping = {
            'en': 'gb',    // Angličtina -> Veľká Británia
            'sk': 'sk',    // Slovenčina -> Slovensko
            'cz': 'cz',    // Čeština -> Česko
            'de': 'de',    // Nemčina -> Nemecko
            'fr': 'fr',    // Francúzština -> Francúzsko
            'es': 'es',    // Španielčina -> Španielsko
            'it': 'it',    // Taliančina -> Taliansko
            'ru': 'ru',    // Ruština -> Rusko
            'pl': 'pl',    // Poľština -> Poľsko
            'hu': 'hu',    // Maďarčina -> Maďarsko
            'nl': 'nl',    // Holandčina -> Holandsko
            'pt': 'pt',    // Portugalčina -> Portugalsko
        };
        
        return flagMapping[langCode.toLowerCase()] || langCode.toLowerCase();
    }

    /**
     * Vytvorí HTML span element s CSS triedami ikony vlajky
     * Používa konvenciu flag-icon knižnice
     * @param {string} langCode - Kód jazyka
     * @param {string} additionalClasses - Extra CSS triedy
     * @returns {string} HTML span element s triedami vlajky
     */
    function createFlagSpan(langCode, additionalClasses = '') {
        const flagCode = getFlagCode(langCode);
        return `<span class="flag-icon flag-icon-${flagCode} ${additionalClasses}"></span>`;
    }

    /**
     * Vytvorí alebo aktualizuje live región pre oznámenia screen readerom
     * Zabezpečuje accessibility pre dynamické zmeny obsahu
     * @param {string} msg - Správa na oznámenie screen readerom
     */
    function announce(msg) {
        // Vytvor live region ak neexistuje
        let live = document.getElementById('a11y-live');
        if (!live) {
            live = document.createElement('div');
            live.id = 'a11y-live';
            live.className = 'sr-only';
            live.setAttribute('aria-live', 'polite');
            document.body.appendChild(live);
            log('Vytvorený a11y-live región');
        }

        live.textContent = '';
        setTimeout(() => { live.textContent = msg; }, 10);
        log('Oznámené:', msg);
    }

    /* ===============================
     * JAZYKOVÝ PREPÍNAČ (Vždy aktívny)
     * ===============================
     * 
     * Funkcie:
     * - Vždy viditeľný a funkčný
     * - Generuje správne <a href> navigačné odkazy
     * - Integruje SVG vlajky z mapovacieho systému
     * - Podporuje voliteľné textové labely
     * - Udržiava stav aktuálneho jazyka
     * - Plná accessibility s ARIA
     */
    function initLanguageSwitch($root, options) {
        const currentLang = options.language || getHtmlLang() || 'sk';
        const urlTemplate = options.languageChangeUrl || '/Home/ChangeLanguage?code={CODE}';
        const labelText = options.languageLabel || ''; // Text pred výber jazyka

        const $current = $root.find('.current');
        const $listbox = $root.find('[role="listbox"]');

        log('Inicializácia jazykového prepínača', { currentLang, urlTemplate, labelText });

        // Nájdi správnu hodnotu pre aktuálny jazyk z dostupných jazykov
        const currentLanguageData = options.languages.find(lang => lang.code.toLowerCase() === currentLang.toLowerCase());
        const displayLang = currentLanguageData ? currentLanguageData.code : currentLang;
        const displayLabel = currentLanguageData ? currentLanguageData.label : currentLang.toUpperCase();
        
        log('Aktuálny jazyk nastavený na:', { displayLang, displayLabel });

        // Nastav aktuálny jazyk v UI s vlajkou a textom
        // Vyčisti aktuálny obsah current elementu (okrem sr-only)
        const $srOnly = $current.find('.sr-only').detach(); // Zachovaj sr-only
        const $arrow = $current.find('.arrow').detach(); // Zachovaj šípku ak existuje
        
        // Vyčisti ostatný obsah
        $current.empty();
        
        // Vytvor novú štruktúru: vlajka + text + sr-only + šípka
        const flagHtml = createFlagSpan(displayLang);
        const displayText = labelText ? `${labelText} ${displayLang.toUpperCase()}` : displayLang.toUpperCase();
        
        $current.append(flagHtml);
        $current.append(`<span class="text">${displayText}</span>`);
        
        // Pridaj sr-only text
        if ($srOnly.length) {
            $srOnly.text(`Current language: ${displayLabel}`);
            $current.append($srOnly);
        } else {
            $current.append(`<span class="sr-only">Current language: ${displayLabel}</span>`);
        }
        
        // Pridaj šípku na koniec ak neexistuje
        if ($arrow.length) {
            $current.append($arrow);
        } else {
            $current.append(`
                <em class="arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                        <title>Open language options</title>
                        <g fill="currentColor"><path d="M5 8l4 4 4-4z"></path></g>
                    </svg>
                </em>
            `);
        }
        
        log('Language UI štruktúra vytvorená:', { displayText, flagClass: `flag-icon-${getFlagCode(displayLang)}` });

        // Generuj jazykové položky s href linkami a vlajkami
        if ($listbox.length) {
            $listbox.empty();

            options.languages.forEach(({ code, label }) => {
                const liId = `opt-lang-${code}`;
                const isSelected = code.toLowerCase() === displayLang.toLowerCase();
                const href = urlTemplate.replace('{CODE}', encodeURIComponent(code));
                const flagHtml = createFlagSpan(code);

                const $li = $(`
          <li id="${liId}" role="option" data-lang="${code}" aria-selected="${isSelected}" class="${isSelected ? 'selected' : ''}">
            <a href="${href}" class="lang-link">
              ${flagHtml}
              <span class="text">${label}</span>
            </a>
          </li>
        `);

                $listbox.append($li);
                log('Pridaná jazyková možnosť:', { code, label, href, isSelected });
            });
        }

        const $items = $listbox.find('[role="option"]').attr('tabindex', '-1');
        log('Jazykový prepínač inicializovaný s', $items.length, 'položkami a vlajkami');

        // Vždy pridaj eventy (jazyk je vždy prepínateľný)
        setupDropdownEvents($root, $current, $listbox, $items, 'language');
    }

    /* ===============================
     * MENOVÝ PREPÍNAČ (Podmienečný)
     * ===============================
     * 
     * Funkcie:
     * - Zobrazuje sa iba ak allowCurrencyChange !== false
     * - Iba UI prepínanie (žiadna navigácia)
     * - Podporuje voliteľné textové labely
     * - Zachováva text labelu počas zmien meny
     * - Spúšťa globálny callback: window.onCurrencyChange()
     * - Plná accessibility s ARIA
     */
    function initCurrencySwitch($root, options) {
        const currentCurrency = options.currency || 'eur';
        const labelText = options.currencyLabel || ''; // Text pred výber meny

        const $current = $root.find('.current');
        const $listbox = $root.find('[role="listbox"]');
        const $items = $listbox.find('[role="option"]').attr('tabindex', '-1');

        log('Inicializácia menového prepínača', { currentCurrency, labelText });

        // Nastav aktuálnu menu v UI s prípadným labelom
        // Vyčisti aktuálny obsah current elementu (okrem sr-only)
        const $srOnly = $current.find('.sr-only').detach(); // Zachovaj sr-only
        const $arrow = $current.find('.arrow').detach(); // Zachovaj šípku ak existuje
        
        // Vyčisti ostatný obsah
        $current.empty();
        
        // Vytvor text s labelom
        const displayText = labelText ? `${labelText} ${currentCurrency.toUpperCase()}` : currentCurrency.toUpperCase();
        
        // Vytvor novú štruktúru: text + sr-only + šípka
        $current.append(`<span class="currency-text" aria-hidden="true">${displayText}</span>`);
        
        // Pridaj sr-only text
        if ($srOnly.length) {
            $srOnly.text(`Current currency: ${currentCurrency.toUpperCase()}`);
            $current.append($srOnly);
        } else {
            $current.append(`<span class="sr-only">Current currency: ${currentCurrency.toUpperCase()}</span>`);
        }
        
        // Pridaj šípku na koniec ak neexistuje
        if ($arrow.length) {
            $current.append($arrow);
        } else {
            $current.append(`
                <em class="arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                        <title>Open currency options</title>
                        <g fill="currentColor"><path d="M5 8l4 4 4-4z"></path></g>
                    </svg>
                </em>
            `);
        }
        
        log('Currency UI štruktúra vytvorená:', { displayText });

        // Označ aktuálnu menu
        $items.removeClass('selected').attr('aria-selected', 'false');
        $items.filter(`[data-currency="${currentCurrency}"]`)
            .addClass('selected')
            .attr('aria-selected', 'true');

        log('Menový prepínač inicializovaný s', $items.length, 'položkami');
        setupDropdownEvents($root, $current, $listbox, $items, 'currency');
    }

    /* ===============================
     * SPRÁVA DROPDOWN EVENTOV
     * ===============================
     * 
     * Zdieľaná správa eventov pre jazykové aj menové dropdowny
     * Funkcie:
     * - Natívny addEventListener s capture fázou
     * - Mobilný overlay systém pre dotyková zariadenia
     * - Klávesová navigácia (šípky, Home, End, Escape)
     * - Globálne klik-mimo-na-zatvorenie
     * - Správna správa ARIA stavov
     * - Responzívne správanie s media queries
     * - Izolácia event namespace (predchádza konfliktom)
     */
    function setupDropdownEvents($root, $current, $listbox, $items, type) {
        /**
         * Sets ARIA expanded state and active descendant
         * Critical for accessibility and screen reader support
         */
        function setExpanded(open) {
            $current.attr('aria-expanded', open ? 'true' : 'false');
            if (!open) {
                $listbox.removeAttr('aria-activedescendant');
            } else {
                const $selected = $items.filter('.selected').first();
                if ($selected.length && $selected.attr('id')) {
                    $listbox.attr('aria-activedescendant', $selected.attr('id'));
                }
            }
        }

        /**
         * Opens dropdown with mobile overlay support
         * Handles focus management and animations
         */
        function open() {
            log('Otváram dropdown pre', type);

            // Zatvor ostatné
            $('.switch.show-options').not($root).each(function () {
                close($(this));
            });

            $root.addClass('show-options');
            setExpanded(true);
            
            // Pre mobilné zobrazenie vytvor overlay
            if (window.matchMedia('(max-width: 768px)').matches) {
                createMobileOverlay();
            }
            
            setTimeout(() => $root.addClass('anim-options'), 50);
            setTimeout(() => $root.addClass('show-shadow'), 200);

            // Fokus na selected alebo prvý
            const $toFocus = $items.filter('.selected').first();
            ($toFocus.length ? $toFocus : $items.first()).focus();
            log('Dropdown otvorený, fokus na:', $toFocus.length ? 'vybraný' : 'prvý');
        }

        /**
         * Closes dropdown and cleans up mobile overlay
         * Handles animation timing and ARIA cleanup
         */
        function close(targetRoot = $root) {
            log('Zatváram dropdown pre', type);
            targetRoot.removeClass('anim-options show-shadow');
            const $btn = targetRoot.find('.current');
            $btn.attr('aria-expanded', 'false');
            targetRoot.find('[role="listbox"]').removeAttr('aria-activedescendant');
            
            // Odstráň mobilný overlay
            removeMobileOverlay();
            
            setTimeout(() => targetRoot.removeClass('show-options'), 600);
        }

        /**
         * Creates mobile overlay for touch device optimization
         * Positioned fixed bottom-left per user requirements
         */
        function createMobileOverlay() {
            if ($('.switch-mobile-overlay').length === 0) {
                const $overlay = $('<div class="switch-mobile-overlay"></div>');
                $('body').append($overlay);
                
                // Event pre zatvorenie klikom na overlay
                $overlay.on('click.switch-overlay', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    log('Klik na mobilný overlay - zatváram dropdown');
                    close();
                });
                
                // Aktivuj overlay s animáciou
                setTimeout(() => $overlay.addClass('active'), 10);
                log('Vytvorený mobilný overlay');
            }
        }

        /**
         * Removes mobile overlay with fade animation
         * Includes proper event cleanup
         */
        function removeMobileOverlay() {
            const $overlay = $('.switch-mobile-overlay');
            if ($overlay.length > 0) {
                $overlay.removeClass('active');
                setTimeout(() => {
                    $overlay.off('click.switch-overlay').remove();
                    log('Odstránený mobilný overlay');
                }, 300);
            }
        }

        // Button events
        $current.off(`click.switch-${type}`).on(`click.switch-${type}`, function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            
            log('Klik na button pre', type);
            
            // Použijem setTimeout na zabránenie race condition
            setTimeout(() => {
                if ($root.hasClass('show-options')) {
                    log('Zatváram dropdown');
                    close();
                } else {
                    log('Otváram dropdown');
                    open();
                }
            }, 10);
        });

        $current.on(`keydown.switch-${type}`, function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if ($root.hasClass('show-options')) close();
                else open();
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                open();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                close();
            }
        });

        // Items events
        $items.on(`click.switch-${type}`, function (e) {
            if (type === 'language') {
                // Pre jazyky nechaj prirodzené správanie <a> linku
                const $link = $(this).find('a.lang-link');
                if ($link.length) {
                    log('Klik na jazykový link:', $link.attr('href'));
                    announce(`Navigating to ${$link.text().trim()}`);
                }
            } else {
                // Pre meny spracuj ako callback
                e.stopPropagation();
                e.preventDefault();

                const newCurrency = $(this).data('currency');
                if (newCurrency) {
                    log('Mena zmenená na:', newCurrency);

                    // Zisti, či existuje label pre menu - hľadaj .currency-text alebo fallback
                    let $textSpan = $current.find('.currency-text');
                    if (!$textSpan.length) {
                        $textSpan = $current.find('span[aria-hidden="true"]');
                    }
                    
                    const currentText = $textSpan.text();
                    const hasLabel = currentText.includes(':');
                    
                    let newDisplayText = newCurrency.toUpperCase();
                    if (hasLabel) {
                        // Zachovaj label text pred menou (hľadaj text pred ":")
                        const labelMatch = currentText.match(/^([^:]+:)\s*/);
                        if (labelMatch) {
                            newDisplayText = `${labelMatch[1]} ${newDisplayText}`;
                        }
                    }

                    // Aktualizuj UI
                    $textSpan.text(newDisplayText);
                    $items.removeClass('selected').attr('aria-selected', 'false');
                    $(this).addClass('selected').attr('aria-selected', 'true');

                    announce(`Currency changed to ${newCurrency.toUpperCase()}`);

                    // Callback ak existuje
                    if (typeof window.onCurrencyChange === 'function') {
                        window.onCurrencyChange(newCurrency);
                    }
                }

                close();
                $current.focus();
            }
        });

        $items.on(`keydown.switch-${type}`, function (e) {
            const $focusable = $items;
            const idx = $focusable.index(this);

            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                close();
                $current.focus();
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                const next = (idx + 1) % $focusable.length;
                const $next = $focusable.eq(next).focus();
                if ($next.attr('id')) {
                    $listbox.attr('aria-activedescendant', $next.attr('id'));
                }
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                const prev = (idx - 1 + $focusable.length) % $focusable.length;
                const $prev = $focusable.eq(prev).focus();
                if ($prev.attr('id')) {
                    $listbox.attr('aria-activedescendant', $prev.attr('id'));
                }
                return;
            }

            if (e.key === 'Home') {
                e.preventDefault();
                e.stopPropagation();
                const $first = $focusable.first().focus();
                if ($first.attr('id')) {
                    $listbox.attr('aria-activedescendant', $first.attr('id'));
                }
                return;
            }

            if (e.key === 'End') {
                e.preventDefault();
                e.stopPropagation();
                const $last = $focusable.last().focus();
                if ($last.attr('id')) {
                    $listbox.attr('aria-activedescendant', $last.attr('id'));
                }
                return;
            }

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                if (type === 'language') {
                    const $link = $(this).find('a.lang-link');
                    if ($link.length) {
                        log('Jazyk vybraný cez klávesnicu:', $link.attr('href'));
                        // Zabráň okamžitému zatvoreniu dropdown-u pred kliknutím
                        setTimeout(() => {
                            $link[0].click(); // Prirodzený klik na link
                        }, 50);
                    }
                } else {
                    // Currency handling
                    $(this).trigger('click');
                }
                return;
            }
        });

        // Global events - native addEventListener s capture
        let globalClickHandler = function(e) {
            // Skontroluj, či klik nie je v rámci dropdown-u
            if (!$root[0].contains(e.target) && $root.hasClass('show-options')) {
                // Dodatočná ochrana - skontroluj či event nie je synthesized z klávesnice
                if (e.isTrusted === false || e.clientX === 0 && e.clientY === 0) {
                    log('Ignorujem keyboard-triggered click event');
                    return;
                }
                log('Klik mimo dropdown - zatváram');
                close();
            }
        };
        
        // Uložíme referenciu pre cleanup
        $root.data('globalClickHandler', globalClickHandler);
        
        // Delay registrácie global eventov aby sa nestali hneď
        setTimeout(() => {
            document.addEventListener('click', globalClickHandler, true); // capture fáza
        }, 200);

        // Delay registrácie keyboard eventov rovnako ako click events
        setTimeout(() => {
            $(document).on(`keydown.switch-${type}`, function (e) {
                if (e.key === 'Escape' && $root.hasClass('show-options')) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    log('ESC klávesa - zatváram iba dropdown, nie modálne okno');
                    close();
                }
            });
        }, 200);

        // Responzívne správanie - vyčisti overlay pri zmene na desktop
        let mobileMediaQuery = window.matchMedia('(max-width: 768px)');
        function handleMobileChange(mq) {
            log('Zmena zobrazenia na:', mq.matches ? 'mobilné' : 'desktop');
            if (!mq.matches) {
                // Pri prepnutí na desktop odstráň overlay
                removeMobileOverlay();
            }
        }
        
        if (mobileMediaQuery.addListener) {
            mobileMediaQuery.addListener(handleMobileChange);
        } else if (mobileMediaQuery.addEventListener) {
            mobileMediaQuery.addEventListener('change', handleMobileChange);
        }
    }

    /* ===============================
     * VEREJNÉ API: LCSwitcher
     * ===============================
     * 
     * Hlavné rozhranie pluginu s komplexnými možnosťami
     * Riešenie prepínania jazykov aj mien
     * Obsahuje debug nástroje a cleanup metódy
     */
    const LCSwitcher = {
        /**
         * Hlavná inicializačná metóda
         * @param {Object} options - Konfiguračný objekt
         * @param {string=} options.language - Kód aktuálneho jazyka (fallback: <html lang>)
         * @param {string=} options.currency - Kód aktuálnej meny pre menový prepínač
         * @param {string[]=} options.languages - Pole reťazcov "kod|Label" (default: CZ + EN)
         * @param {boolean=} options.allowCurrencyChange - Zobraziť menový prepínač (default: true)
         * @param {string=} options.languageChangeUrl - URL šablóna pre jazykové odkazy
         * @param {string=} options.languageLabel - Textový prefix pre výber jazyka
         * @param {string=} options.currencyLabel - Textový prefix pre výber meny
         * @param {boolean=} options.debug - Povoliť logovania do konzoly (default: false)
         */
        init(options) {
            options = options || {};

            // Nastav debug mode
            DEBUG = !!options.debug;
            log('LCSwitcher inicializácia začatá', options);

            // Spracuj jazyky
            const langsInput = options.languages || ["cz|Česky", "en|English"];
            const languages = langsInput
                .map(String)
                .map(s => s.trim())
                .filter(Boolean)
                .map(pair => {
                    const parts = pair.split('|');
                    const code = (parts[0] || '').trim();
                    const label = (parts[1] || code).trim();
                    return { code, label };
                })
                .filter(x => x.code);

            log('Spracované jazyky:', languages);

            // Aktuálny jazyk: options.language -> <html lang> -> fallback
            const currentLanguage = options.language || getHtmlLang() || 'sk';
            log('Aktuálny jazyk určený ako:', currentLanguage);

            // Inicializuj language switchers
            const $langSwitchers = $('.switch.lang');
            log('Nájdené jazykové prepínače:', $langSwitchers.length);

            $langSwitchers.each(function () {
                initLanguageSwitch($(this), {
                    language: currentLanguage,
                    languages: languages,
                    languageChangeUrl: options.languageChangeUrl,
                    languageLabel: options.languageLabel
                });
            });

            // Inicializuj currency switchers (iba ak je povolené)
            if (options.allowCurrencyChange !== false) {
                const $currSwitchers = $('.switch.currency');
                log('Nájdené menové prepínače:', $currSwitchers.length);

                $currSwitchers.each(function () {
                    initCurrencySwitch($(this), {
                        currency: options.currency,
                        allowCurrencyChange: options.allowCurrencyChange,
                        currencyLabel: options.currencyLabel
                    });
                });
            } else {
                // Skry všetky currency switchers ak sú zakázané
                $('.switch.currency').hide();
                log('Menové prepínače skryté kvôli allowCurrencyChange: false');
            }

            // Nastav data atribúty na <html>
            if (currentLanguage) {
                document.documentElement.setAttribute('data-lang', currentLanguage);
                log('Nastavený data-lang atribút na:', currentLanguage);
            }
            if (options.currency) {
                document.documentElement.setAttribute('data-currency', options.currency);
                log('Nastavený data-currency atribút na:', options.currency);
            }

            log('LCSwitcher inicializácia dokončená');
        },

        /**
         * Enables debug console logging
         * Useful for development and troubleshooting
         */
        enableDebug() {
            DEBUG = true;
            log('Debug režim zapnutý');
        },

        /**
         * Disables debug console logging
         */
        disableDebug() {
            DEBUG = false;
        },

        /**
         * Complete cleanup of all plugin events and state
         * Removes native event listeners and jQuery events
         * Resets visual state to defaults
         */
        destroy() {
            log('Odstraňovanie LCSwitcher eventov');
            
            // Odstráň všetky switch eventy
            $('.switch').off('.switch-language .switch-currency');
            $(document).off('.switch-language .switch-currency');
            $(window).off('.switch-language .switch-currency');
            
            // Odstráň native event listeners
            $('.switch').each(function() {
                const handler = $(this).data('globalClickHandler');
                if (handler) {
                    document.removeEventListener('click', handler, true);
                    $(this).removeData('globalClickHandler');
                }
            });
            
            // Vyčisti pozičné triedy
            $('.switch .options').removeClass('dropdown-top dropdown-right dropdown-left');
            
            // Zatvor všetky otvorené dropdowns
            $('.switch.show-options').removeClass('show-options anim-options show-shadow');
            
            log('LCSwitcher eventy odstránené');
        }
    };

    // Export do globálu
    window.LCSwitcher = LCSwitcher;

})(jQuery, window, document);

/* ===============================
 * AUTOMATICKÁ INICIALIZÁCIA
 * ===============================
 * 
 * Predvolené nastavenie pre okamžité použitie
 * Prispôsobte tieto hodnoty pre vašu aplikáciu
 */
$(document).ready(function () {
    if (window.LCSwitcher) {
        LCSwitcher.init({
            language: document.documentElement.getAttribute('lang'),
            languages: [
                "sk|Slovenčina",
                "cz|Čeština",
                "en|English",
                "de|Deutsch",
                "ru|Русский",
                "hu|Magyar"
            ],
            languageChangeUrl: '/Home/ChangeLanguage?code={CODE}', // Upraviť podľa potreby
            allowCurrencyChange: true, // Zmeniť na false ak chceš úplne skryť currency switcher
            debug: false // Zmeniť na true pre debug výpisy
        });
    }
});
