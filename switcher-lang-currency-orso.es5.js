/* 
 * Language & Currency Switcher (server-driven, accessibility-first)
 * ==================================================================
 * 
 * COMPLETE FEATURE SET (for AI continuity):
 * - Language switching: Always visible with <a href> navigation links
 * - Currency switching: UI-only with configurable display
 * - Flag integration: SVG flags from ~/Content/flags/4x3/*.svg
 * - Mobile optimization: Fixed bottom-left positioning with overlay
 * - CSS custom properties: 67 variables with --tp-lang-switcher- prefix
 * - Label support: Optional text prefixes for both language and currency
 * - Accessibility: Full ARIA support, screen reader announcements
 * - Event handling: Native addEventListener with proper cleanup
 * 
 * HTML STRUCTURE REQUIREMENTS:
 * ```html
 * <div class="switch lang">
 *   <button class="current" role="combobox" aria-expanded="false" aria-haspopup="listbox">
 *     <!-- Generated: flag + text + sr-only + arrow -->
 *   </button>
 *   <ul class="options" role="listbox">
 *     <!-- Generated language options with flags -->
 *   </ul>
 * </div>
 * ```
 * 
 * DEPENDENCIES:
 * - jQuery 3.0+
 * - switcher-lang-currency-orso.css (compiled from SCSS)
 * - SVG flag files in ~/Content/flags/4x3/ directory
 * 
 * INITIALIZATION:
 * ```javascript
 * LCSwitcher.init({
 *   language: 'sk',           // Current language code
 *   currency: 'eur',          // Current currency code  
 *   languages: ['sk|Slovenčina', 'en|English'], // Available languages
 *   languageLabel: 'Language:', // Optional text prefix
 *   currencyLabel: 'Currency:', // Optional text prefix
 *   allowCurrencyChange: true, // Show/hide currency switcher
 *   languageChangeUrl: '/Home/ChangeLanguage?code={CODE}',
 *   debug: false              // Console logging
 * });
 * ```
 */

'use strict';

(function ($, window, document) {
    'use strict';

    // Debug flag - nastavuje sa cez options.debug
    var DEBUG = false;

    function log() {
        if (DEBUG && console && console.log) {
            console.log.apply(console, ['LCSwitcher:'].concat(Array.prototype.slice.call(arguments)));
        }
    }

    /* ===============================
     * UTILITY FUNCTIONS
     * =============================== */

    /**
     * Extracts language code from HTML document element
     * Falls back to empty string if not found
     * @returns {string} Language code (e.g., 'sk', 'en')
     */
    function getHtmlLang() {
        var lang = (document.documentElement.lang || '').trim();
        return lang ? lang.toLowerCase().split('-')[0] : '';
    }

    /**
     * Maps language codes to flag country codes
     * Handles special cases like 'en' -> 'gb'
     * @param {string} langCode - Language code (e.g., 'en', 'sk')
     * @returns {string} Flag country code for CSS class
     */
    function getFlagCode(langCode) {
        // Mapovanie jazykových kódov na vlajky
        var flagMapping = {
            'en': 'gb', // Angličtina -> Veľká Británia
            'sk': 'sk', // Slovenčina -> Slovensko
            'cz': 'cz', // Čeština -> Česko
            'de': 'de', // Nemčina -> Nemecko
            'fr': 'fr', // Francúzština -> Francúzsko
            'es': 'es', // Španielčina -> Španielsko
            'it': 'it', // Taliančina -> Taliansko
            'ru': 'ru', // Ruština -> Rusko
            'pl': 'pl', // Poľština -> Poľsko
            'hu': 'hu', // Maďarčina -> Maďarsko
            'nl': 'nl', // Holandčina -> Holandsko
            'pt': 'pt' };

        // Portugalčina -> Portugalsko
        return flagMapping[langCode.toLowerCase()] || langCode.toLowerCase();
    }

    /**
     * Creates HTML span element with flag icon CSS classes
     * Uses flag-icon library convention
     * @param {string} langCode - Language code
     * @param {string} additionalClasses - Extra CSS classes
     * @returns {string} HTML span element with flag classes
     */
    function createFlagSpan(langCode) {
        var additionalClasses = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

        var flagCode = getFlagCode(langCode);
        return '<span class="flag-icon flag-icon-' + flagCode + ' ' + additionalClasses + '"></span>';
    }

    /**
     * Creates or updates live region for screen reader announcements
     * Ensures accessibility for dynamic content changes
     * @param {string} msg - Message to announce to screen readers
     */
    function announce(msg) {
        // Vytvor live region ak neexistuje
        var live = document.getElementById('a11y-live');
        if (!live) {
            live = document.createElement('div');
            live.id = 'a11y-live';
            live.className = 'sr-only';
            live.setAttribute('aria-live', 'polite');
            document.body.appendChild(live);
            log('Vytvorený a11y-live región');
        }

        live.textContent = '';
        setTimeout(function () {
            live.textContent = msg;
        }, 10);
        log('Oznámené:', msg);
    }

    /* ===============================
     * LANGUAGE SWITCHER (Always Active)
     * ===============================
     * 
     * Features:
     * - Always visible and functional
     * - Generates proper <a href> navigation links
     * - Integrates SVG flags from mapping system
     * - Supports optional text labels
     * - Maintains current language state
     * - Full accessibility with ARIA
     */
    function initLanguageSwitch($root, options) {
        var currentLang = options.language || getHtmlLang() || 'sk';
        var urlTemplate = options.languageChangeUrl || '/Home/ChangeLanguage?code={CODE}';
        var labelText = options.languageLabel || ''; // Text pred výber jazyka

        var $current = $root.find('.current');
        var $listbox = $root.find('[role="listbox"]');

        log('Inicializácia jazykového prepínača', { currentLang: currentLang, urlTemplate: urlTemplate, labelText: labelText });

        // Nájdi správnu hodnotu pre aktuálny jazyk z dostupných jazykov
        var currentLanguageData = options.languages.find(function (lang) {
            return lang.code.toLowerCase() === currentLang.toLowerCase();
        });
        var displayLang = currentLanguageData ? currentLanguageData.code : currentLang;
        var displayLabel = currentLanguageData ? currentLanguageData.label : currentLang.toUpperCase();

        log('Aktuálny jazyk nastavený na:', { displayLang: displayLang, displayLabel: displayLabel });

        // Nastav aktuálny jazyk v UI s vlajkou a textom
        // Vyčisti aktuálny obsah current elementu (okrem sr-only)
        var $srOnly = $current.find('.sr-only').detach(); // Zachovaj sr-only
        var $arrow = $current.find('.arrow').detach(); // Zachovaj šípku ak existuje

        // Vyčisti ostatný obsah
        $current.empty();

        // Vytvor novú štruktúru: vlajka + text + sr-only + šípka
        var flagHtml = createFlagSpan(displayLang);
        var displayText = labelText ? labelText + ' ' + displayLang.toUpperCase() : displayLang.toUpperCase();

        $current.append(flagHtml);
        $current.append('<span class="text">' + displayText + '</span>');

        // Pridaj sr-only text
        if ($srOnly.length) {
            $srOnly.text('Current language: ' + displayLabel);
            $current.append($srOnly);
        } else {
            $current.append('<span class="sr-only">Current language: ' + displayLabel + '</span>');
        }

        // Pridaj šípku na koniec ak neexistuje
        if ($arrow.length) {
            $current.append($arrow);
        } else {
            $current.append('\n                <em class="arrow">\n                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">\n                        <title>Open language options</title>\n                        <g fill="currentColor"><path d="M5 8l4 4 4-4z"></path></g>\n                    </svg>\n                </em>\n            ');
        }

        log('Language UI štruktúra vytvorená:', { displayText: displayText, flagClass: 'flag-icon-' + getFlagCode(displayLang) });

        // Generuj jazykové položky s href linkami a vlajkami
        if ($listbox.length) {
            $listbox.empty();

            options.languages.forEach(function (_ref) {
                var code = _ref.code;
                var label = _ref.label;

                var liId = 'opt-lang-' + code;
                var isSelected = code.toLowerCase() === displayLang.toLowerCase();
                var href = urlTemplate.replace('{CODE}', encodeURIComponent(code));
                var flagHtml = createFlagSpan(code);

                var $li = $('\n          <li id="' + liId + '" role="option" data-lang="' + code + '" aria-selected="' + isSelected + '" class="' + (isSelected ? 'selected' : '') + '">\n            <a href="' + href + '" class="lang-link">\n              ' + flagHtml + '\n              <span class="text">' + label + '</span>\n            </a>\n          </li>\n        ');

                $listbox.append($li);
                log('Pridaná jazyková možnosť:', { code: code, label: label, href: href, isSelected: isSelected });
            });
        }

        var $items = $listbox.find('[role="option"]').attr('tabindex', '-1');
        log('Jazykový prepínač inicializovaný s', $items.length, 'položkami a vlajkami');

        // Vždy pridaj eventy (jazyk je vždy prepínateľný)
        setupDropdownEvents($root, $current, $listbox, $items, 'language');
    }

    /* ===============================
     * CURRENCY SWITCHER (Conditional)
     * ===============================
     * 
     * Features:
     * - Shows only if allowCurrencyChange !== false
     * - UI-only switching (no navigation)
     * - Supports optional text labels
     * - Preserves label text during currency changes
     * - Triggers global callback: window.onCurrencyChange()
     * - Full accessibility with ARIA
     */
    function initCurrencySwitch($root, options) {
        var currentCurrency = options.currency || 'eur';
        var labelText = options.currencyLabel || ''; // Text pred výber meny

        var $current = $root.find('.current');
        var $listbox = $root.find('[role="listbox"]');
        var $items = $listbox.find('[role="option"]').attr('tabindex', '-1');

        log('Inicializácia menového prepínača', { currentCurrency: currentCurrency, labelText: labelText });

        // Nastav aktuálnu menu v UI s prípadným labelom
        // Vyčisti aktuálny obsah current elementu (okrem sr-only)
        var $srOnly = $current.find('.sr-only').detach(); // Zachovaj sr-only
        var $arrow = $current.find('.arrow').detach(); // Zachovaj šípku ak existuje

        // Vyčisti ostatný obsah
        $current.empty();

        // Vytvor text s labelom
        var displayText = labelText ? labelText + ' ' + currentCurrency.toUpperCase() : currentCurrency.toUpperCase();

        // Vytvor novú štruktúru: text + sr-only + šípka
        $current.append('<span class="currency-text" aria-hidden="true">' + displayText + '</span>');

        // Pridaj sr-only text
        if ($srOnly.length) {
            $srOnly.text('Current currency: ' + currentCurrency.toUpperCase());
            $current.append($srOnly);
        } else {
            $current.append('<span class="sr-only">Current currency: ' + currentCurrency.toUpperCase() + '</span>');
        }

        // Pridaj šípku na koniec ak neexistuje
        if ($arrow.length) {
            $current.append($arrow);
        } else {
            $current.append('\n                <em class="arrow">\n                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">\n                        <title>Open currency options</title>\n                        <g fill="currentColor"><path d="M5 8l4 4 4-4z"></path></g>\n                    </svg>\n                </em>\n            ');
        }

        log('Currency UI štruktúra vytvorená:', { displayText: displayText });

        // Označ aktuálnu menu
        $items.removeClass('selected').attr('aria-selected', 'false');
        $items.filter('[data-currency="' + currentCurrency + '"]').addClass('selected').attr('aria-selected', 'true');

        log('Menový prepínač inicializovaný s', $items.length, 'položkami');
        setupDropdownEvents($root, $current, $listbox, $items, 'currency');
    }

    /* ===============================
     * DROPDOWN EVENT MANAGEMENT
     * ===============================
     * 
     * Shared event handling for both language and currency dropdowns
     * Features:
     * - Native addEventListener with capture phase
     * - Mobile overlay system for touch devices
     * - Keyboard navigation (Arrow keys, Home, End, Escape)
     * - Global click-outside-to-close
     * - Proper ARIA state management
     * - Responsive behavior with media queries
     * - Event namespace isolation (prevents conflicts)
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
                var $selected = $items.filter('.selected').first();
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

            setTimeout(function () {
                return $root.addClass('anim-options');
            }, 50);
            setTimeout(function () {
                return $root.addClass('show-shadow');
            }, 200);

            // Fokus na selected alebo prvý
            var $toFocus = $items.filter('.selected').first();
            ($toFocus.length ? $toFocus : $items.first()).focus();
            log('Dropdown otvorený, fokus na:', $toFocus.length ? 'vybraný' : 'prvý');
        }

        /**
         * Closes dropdown and cleans up mobile overlay
         * Handles animation timing and ARIA cleanup
         */
        function close() {
            var targetRoot = arguments.length <= 0 || arguments[0] === undefined ? $root : arguments[0];

            log('Zatváram dropdown pre', type);
            targetRoot.removeClass('anim-options show-shadow');
            var $btn = targetRoot.find('.current');
            $btn.attr('aria-expanded', 'false');
            targetRoot.find('[role="listbox"]').removeAttr('aria-activedescendant');

            // Odstráň mobilný overlay
            removeMobileOverlay();

            setTimeout(function () {
                return targetRoot.removeClass('show-options');
            }, 600);
        }

        /**
         * Creates mobile overlay for touch device optimization
         * Positioned fixed bottom-left per user requirements
         */
        function createMobileOverlay() {
            if ($('.switch-mobile-overlay').length === 0) {
                (function () {
                    var $overlay = $('<div class="switch-mobile-overlay"></div>');
                    $('body').append($overlay);

                    // Event pre zatvorenie klikom na overlay
                    $overlay.on('click.switch-overlay', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        log('Klik na mobilný overlay - zatváram dropdown');
                        close();
                    });

                    // Aktivuj overlay s animáciou
                    setTimeout(function () {
                        return $overlay.addClass('active');
                    }, 10);
                    log('Vytvorený mobilný overlay');
                })();
            }
        }

        /**
         * Removes mobile overlay with fade animation
         * Includes proper event cleanup
         */
        function removeMobileOverlay() {
            var $overlay = $('.switch-mobile-overlay');
            if ($overlay.length > 0) {
                $overlay.removeClass('active');
                setTimeout(function () {
                    $overlay.off('click.switch-overlay').remove();
                    log('Odstránený mobilný overlay');
                }, 300);
            }
        }

        // Button events
        $current.off('click.switch-' + type).on('click.switch-' + type, function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();

            log('Klik na button pre', type);

            // Použijem setTimeout na zabránenie race condition
            setTimeout(function () {
                if ($root.hasClass('show-options')) {
                    log('Zatváram dropdown');
                    close();
                } else {
                    log('Otváram dropdown');
                    open();
                }
            }, 10);
        });

        $current.on('keydown.switch-' + type, function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if ($root.hasClass('show-options')) close();else open();
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                open();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
        });

        // Items events
        $items.on('click.switch-' + type, function (e) {
            if (type === 'language') {
                // Pre jazyky nechaj prirodzené správanie <a> linku
                var $link = $(this).find('a.lang-link');
                if ($link.length) {
                    log('Klik na jazykový link:', $link.attr('href'));
                    announce('Navigating to ' + $link.text().trim());
                }
            } else {
                // Pre meny spracuj ako callback
                e.stopPropagation();
                e.preventDefault();

                var newCurrency = $(this).data('currency');
                if (newCurrency) {
                    log('Mena zmenená na:', newCurrency);

                    // Zisti, či existuje label pre menu - hľadaj .currency-text alebo fallback
                    var $textSpan = $current.find('.currency-text');
                    if (!$textSpan.length) {
                        $textSpan = $current.find('span[aria-hidden="true"]');
                    }

                    var currentText = $textSpan.text();
                    var hasLabel = currentText.includes(':');

                    var newDisplayText = newCurrency.toUpperCase();
                    if (hasLabel) {
                        // Zachovaj label text pred menou (hľadaj text pred ":")
                        var labelMatch = currentText.match(/^([^:]+:)\s*/);
                        if (labelMatch) {
                            newDisplayText = labelMatch[1] + ' ' + newDisplayText;
                        }
                    }

                    // Aktualizuj UI
                    $textSpan.text(newDisplayText);
                    $items.removeClass('selected').attr('aria-selected', 'false');
                    $(this).addClass('selected').attr('aria-selected', 'true');

                    announce('Currency changed to ' + newCurrency.toUpperCase());

                    // Callback ak existuje
                    if (typeof window.onCurrencyChange === 'function') {
                        window.onCurrencyChange(newCurrency);
                    }
                }

                close();
                $current.focus();
            }
        });

        $items.on('keydown.switch-' + type, function (e) {
            var $focusable = $items;
            var idx = $focusable.index(this);

            if (e.key === 'Escape') {
                e.preventDefault();
                close();
                $current.focus();
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                var next = (idx + 1) % $focusable.length;
                var $next = $focusable.eq(next).focus();
                if ($next.attr('id')) {
                    $listbox.attr('aria-activedescendant', $next.attr('id'));
                }
                return;
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                var prev = (idx - 1 + $focusable.length) % $focusable.length;
                var $prev = $focusable.eq(prev).focus();
                if ($prev.attr('id')) {
                    $listbox.attr('aria-activedescendant', $prev.attr('id'));
                }
                return;
            }

            if (e.key === 'Home') {
                e.preventDefault();
                var $first = $focusable.first().focus();
                if ($first.attr('id')) {
                    $listbox.attr('aria-activedescendant', $first.attr('id'));
                }
                return;
            }

            if (e.key === 'End') {
                e.preventDefault();
                var $last = $focusable.last().focus();
                if ($last.attr('id')) {
                    $listbox.attr('aria-activedescendant', $last.attr('id'));
                }
                return;
            }

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();

                if (type === 'language') {
                    var $link = $(this).find('a.lang-link');
                    if ($link.length) {
                        log('Jazyk vybraný cez klávesnicu:', $link.attr('href'));
                        $link[0].click(); // Prirodzený klik na link
                    }
                } else {
                        // Currency handling
                        $(this).trigger('click');
                    }
                return;
            }
        });

        // Global events - native addEventListener s capture
        var globalClickHandler = function globalClickHandler(e) {
            // Skontroluj, či klik nie je v rámci dropdown-u
            if (!$root[0].contains(e.target) && $root.hasClass('show-options')) {
                log('Klik mimo dropdown - zatváram');
                close();
            }
        };

        // Uložíme referenciu pre cleanup
        $root.data('globalClickHandler', globalClickHandler);

        // Delay registrácie global eventov aby sa nestali hneď
        setTimeout(function () {
            document.addEventListener('click', globalClickHandler, true); // capture fáza
        }, 200);

        $(document).on('keydown.switch-' + type, function (e) {
            if (e.key === 'Escape' && $root.hasClass('show-options')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                log('ESC klávesa - zatváram iba dropdown, nie modálne okno');
                close();
            }
        });

        // Responzívne správanie - vyčisti overlay pri zmene na desktop
        var mobileMediaQuery = window.matchMedia('(max-width: 768px)');
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
     * PUBLIC API: LCSwitcher
     * ===============================
     * 
     * Main plugin interface with comprehensive options
     * Handles both language and currency switching
     * Includes debug utilities and cleanup methods
     */
    var LCSwitcher = {
        /**
         * Main initialization method
         * @param {Object} options - Configuration object
         * @param {string=} options.language - Current language code (fallback: <html lang>)
         * @param {string=} options.currency - Current currency code for currency switcher
         * @param {string[]=} options.languages - Array of "code|Label" strings (default: CZ + EN)
         * @param {boolean=} options.allowCurrencyChange - Show currency switcher (default: true)
         * @param {string=} options.languageChangeUrl - URL template for language links
         * @param {string=} options.languageLabel - Text prefix for language selector
         * @param {string=} options.currencyLabel - Text prefix for currency selector
         * @param {boolean=} options.debug - Enable console logging (default: false)
         */
        init: function init(options) {
            options = options || {};

            // Nastav debug mode
            DEBUG = !!options.debug;
            log('LCSwitcher inicializácia začatá', options);

            // Spracuj jazyky
            var langsInput = options.languages || ["cz|Česky", "en|English"];
            var languages = langsInput.map(String).map(function (s) {
                return s.trim();
            }).filter(Boolean).map(function (pair) {
                var parts = pair.split('|');
                var code = (parts[0] || '').trim();
                var label = (parts[1] || code).trim();
                return { code: code, label: label };
            }).filter(function (x) {
                return x.code;
            });

            log('Spracované jazyky:', languages);

            // Aktuálny jazyk: options.language -> <html lang> -> fallback
            var currentLanguage = options.language || getHtmlLang() || 'sk';
            log('Aktuálny jazyk určený ako:', currentLanguage);

            // Inicializuj language switchers
            var $langSwitchers = $('.switch.lang');
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
                var $currSwitchers = $('.switch.currency');
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
        enableDebug: function enableDebug() {
            DEBUG = true;
            log('Debug režim zapnutý');
        },

        /**
         * Disables debug console logging
         */
        disableDebug: function disableDebug() {
            DEBUG = false;
        },

        /**
         * Complete cleanup of all plugin events and state
         * Removes native event listeners and jQuery events
         * Resets visual state to defaults
         */
        destroy: function destroy() {
            log('Odstraňovanie LCSwitcher eventov');

            // Odstráň všetky switch eventy
            $('.switch').off('.switch-language .switch-currency');
            $(document).off('.switch-language .switch-currency');
            $(window).off('.switch-language .switch-currency');

            // Odstráň native event listeners
            $('.switch').each(function () {
                var handler = $(this).data('globalClickHandler');
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
 * AUTO-INITIALIZATION
 * ===============================
 * 
 * Default setup for immediate use
 * Customize these values for your application
 */
$(document).ready(function () {
    if (window.LCSwitcher) {
        LCSwitcher.init({
            language: document.documentElement.getAttribute('lang'),
            languages: ["sk|Slovenčina", "cz|Čeština", "en|English", "de|Deutsch", "ru|Русский", "hu|Magyar"],
            languageChangeUrl: '/Home/ChangeLanguage?code={CODE}', // Upraviť podľa potreby
            allowCurrencyChange: true, // Zmeniť na false ak chceš úplne skryť currency switcher
            debug: false // Zmeniť na true pre debug výpisy
        });
    }
});

